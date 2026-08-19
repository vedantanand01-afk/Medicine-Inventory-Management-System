const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../../.env' });

const app = require('../../server');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('----------------------------------------------------');
  console.log('🧪 RUNNING COMPREHENSIVE BACKEND API INTEGRATION TESTS');
  console.log('----------------------------------------------------');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ [PASS]: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL]: ${message}`);
      failed++;
    }
  };

  const port = process.env.PORT || 5000;
  let adminToken = '';
  let pharmacistToken = '';
  let createdMedId = '';
  let createdSupplierId = '';

  try {
    // 1. Health Check
    const healthRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/health',
      method: 'GET',
    });
    assert(healthRes.status === 200 && healthRes.data.success === true, 'Health check endpoint returns 200 OK');

    // 2. Admin Login
    const adminLoginRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@medinventory.com', password: 'Admin@123' }
    );
    assert(adminLoginRes.status === 200 && adminLoginRes.data.data.token, 'Admin login successfully retrieves JWT token');
    adminToken = adminLoginRes.data.data ? adminLoginRes.data.data.token : '';

    // 3. Pharmacist Login
    const pharmLoginRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'pharmacist@medinventory.com', password: 'Pharm@123' }
    );
    assert(pharmLoginRes.status === 200 && pharmLoginRes.data.data.role === 'Pharmacist', 'Pharmacist login successfully identifies role');
    pharmacistToken = pharmLoginRes.data.data ? pharmLoginRes.data.data.token : '';

    // 4. Role Authorization Check: Pharmacist accessing Admin-only /api/users
    const userAccessRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${pharmacistToken}` },
    });
    assert(userAccessRes.status === 403, 'Pharmacist is correctly forbidden (403) from accessing admin User Management');

    // 5. Dashboard Stats
    const statsRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(statsRes.status === 200 && statsRes.data.data.totalMedicines >= 12, 'Dashboard stats return accurate total medicine counts');

    // 6. Get Medicines list with filter
    const medsRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/medicines',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(medsRes.status === 200 && Array.isArray(medsRes.data.data), 'Medicines list returns array with enriched stock and expiry details');

    // 7. Get Suppliers
    const supRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/suppliers',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(supRes.status === 200 && supRes.data.data.length >= 5, 'Suppliers list returns active suppliers with medicine counts');
    const firstSupplierId = supRes.data.data[0]._id;

    // 8. Create a New Medicine with initial stock
    const newMedRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/medicines',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        medicineId: 'MED-9999',
        medicineName: 'Test Antibiotic Doxycycline 100mg',
        genericName: 'Doxycycline Hyclate',
        category: 'Antibiotics',
        dosageForm: 'Capsule',
        supplier: firstSupplierId,
        batchNumber: 'BATCH-DOX-999',
        manufacturingDate: '2026-01-01',
        expiryDate: '2027-12-31',
        unitPrice: 15.0,
        costPrice: 8.0,
        reorderLevel: 25,
        description: 'Test antibiotic capsule',
        initialQuantity: 100,
      }
    );
    assert(newMedRes.status === 201 && newMedRes.data.data.currentStock === 100, 'Create medicine successfully initializes 100 stock units');
    createdMedId = newMedRes.data.data ? newMedRes.data.data._id : '';

    // 9. Stock In (Restock)
    const stockInRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/stock/in',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        medicineId: createdMedId,
        quantity: 50,
        unitCost: 8.0,
        notes: 'Test restock batch',
      }
    );
    assert(stockInRes.status === 200 && stockInRes.data.data.stock.quantity === 150, 'Stock In increments inventory atomically to 150 units');

    // 10. Perform Valid Sale Transaction
    const saleRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/transactions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pharmacistToken}`,
        },
      },
      {
        medicineId: createdMedId,
        quantity: 10,
        unitPrice: 15.0,
        customerName: 'Test Patient',
      }
    );
    assert(saleRes.status === 201 && saleRes.data.data.remainingStock === 140, 'Sale transaction safely decrements stock to 140 units');

    // 11. Edge Case: Prevent Sale exceeding available stock
    const excessSaleRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/transactions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pharmacistToken}`,
        },
      },
      {
        medicineId: createdMedId,
        quantity: 500, // available is only 140
      }
    );
    assert(excessSaleRes.status === 400, 'Sale exceeding available stock is strictly rejected with 400 Bad Request');

    // 12. Edge Case: Prevent Sale of EXPIRED medicine (Ibuprofen MED-1004 is seeded as expired)
    const expiredMed = medsRes.data.data.find((m) => m.medicineId === 'MED-1004');
    if (expiredMed) {
      const expiredSaleRes = await makeRequest(
        {
          hostname: 'localhost',
          port,
          path: '/api/transactions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${pharmacistToken}`,
          },
        },
        {
          medicineId: expiredMed._id,
          quantity: 2,
        }
      );
      assert(expiredSaleRes.status === 400 && expiredSaleRes.data.message.includes('EXPIRED'), 'Attempting to sell expired medicine is strictly blocked by backend');
    }

    // 13. Expiry & Low Stock Alerts
    const alertsRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/alerts/expiry',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(alertsRes.status === 200 && alertsRes.data.data.expired.length > 0, 'Expiry alerts correctly identify expired and near-expiry medicines');

    // Clean up created test medicine
    if (createdMedId) {
      await makeRequest({
        hostname: 'localhost',
        port,
        path: `/api/medicines/${createdMedId}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }

    console.log('----------------------------------------------------');
    console.log(`🏁 TESTS FINISHED: Passed: ${passed}, Failed: ${failed}`);
    console.log('----------------------------------------------------');

    if (failed === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('[Test Error]:', err);
    process.exit(1);
  }
};

// Wait 1 second for server to initialize then run tests
setTimeout(runTests, 1000);
