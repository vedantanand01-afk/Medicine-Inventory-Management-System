const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');

dotenv.config({ path: __dirname + '/../../.env' });

const seedDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medicine_inventory';
    await mongoose.connect(mongoUri);
    console.log(`[Seed DB Connected]: ${mongoUri}`);

    // Clear existing collections
    await User.deleteMany({});
    await Supplier.deleteMany({});
    await Medicine.deleteMany({});
    await Stock.deleteMany({});
    await Transaction.deleteMany({});
    await Setting.deleteMany({});
    console.log('[Seed]: Cleared existing database collections.');

    // 1. Create Default Users
    const adminUser = await User.create({
      userId: 'USR-1001',
      name: 'Dr. Amit Sharma (Admin)',
      email: 'admin@medinventory.com',
      password: 'Admin@123',
      role: 'Admin',
      phone: '+91 9876543210',
      status: 'Active',
    });

    const staffUser = await User.create({
      userId: 'USR-1002',
      name: 'Priya Verma (Pharmacist)',
      email: 'pharmacist@medinventory.com',
      password: 'Pharm@123',
      role: 'Pharmacist',
      phone: '+91 9876543211',
      status: 'Active',
    });

    console.log('[Seed]: Created Admin and Pharmacist demo users.');

    // 2. Create Suppliers
    const suppliersData = [
      {
        supplierId: 'SUP-1001',
        supplierName: 'Sun Pharma Distribution India',
        contactPerson: 'Rajesh Sharma',
        phone: '+91 98201 11001',
        email: 'orders@sunpharma-dist.in',
        address: 'Plot 45, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093',
      },
      {
        supplierId: 'SUP-1002',
        supplierName: 'Cipla Healthcare Logistics',
        contactPerson: 'Priya Nair',
        phone: '+91 98201 11002',
        email: 'supply@cipla-logistics.in',
        address: 'Cipla House, Peninsula Business Park, Lower Parel, Mumbai, Maharashtra 400013',
      },
      {
        supplierId: 'SUP-1003',
        supplierName: "Dr. Reddy's Laboratories Distribution",
        contactPerson: 'Karthik Reddy',
        phone: '+91 98490 11003',
        email: 'sales@drreddys-dist.in',
        address: '7-1-27 Ameerpet, Hyderabad, Telangana 500016',
      },
      {
        supplierId: 'SUP-1004',
        supplierName: 'Lupin Pharma Logistics India',
        contactPerson: 'Suresh Mehta',
        phone: '+91 98791 11004',
        email: 'support@lupin-logistics.in',
        address: '12 GIDC Estate, Vatva, Ahmedabad, Gujarat 382445',
      },
      {
        supplierId: 'SUP-1005',
        supplierName: 'Mankind Pharma Direct Distribution',
        contactPerson: 'Vikram Malhotra',
        phone: '+91 98110 11005',
        email: 'orders@mankind-direct.in',
        address: '208 Okhla Industrial Estate Phase III, New Delhi, Delhi 110020',
      },
    ];

    const createdSuppliers = await Supplier.insertMany(suppliersData);
    console.log(`[Seed]: Created ${createdSuppliers.length} suppliers.`);

    // 3. Create Medicines with varied stock & expiry states
    const today = new Date();

    // Helper date generator
    const addDays = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d;
    };

    const subDays = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return d;
    };

    const medicinesData = [
      {
        medicineId: 'MED-1001',
        medicineName: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        category: 'Analgesics',
        dosageForm: 'Tablet',
        supplier: createdSuppliers[0]._id,
        batchNumber: 'BATCH-PCM-092',
        manufacturingDate: subDays(180),
        expiryDate: addDays(400), // Valid
        unitPrice: 5.5,
        costPrice: 2.8,
        reorderLevel: 50,
        description: 'Pain relief and fever reducer for common ailments.',
        location: 'Shelf A1',
        initialQty: 250, // In Stock
      },
      {
        medicineId: 'MED-1002',
        medicineName: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin Trihydrate',
        category: 'Antibiotics',
        dosageForm: 'Capsule',
        supplier: createdSuppliers[1]._id,
        batchNumber: 'BATCH-AMX-114',
        manufacturingDate: subDays(240),
        expiryDate: addDays(320), // Valid
        unitPrice: 14.0,
        costPrice: 8.5,
        reorderLevel: 30,
        description: 'Broad spectrum penicillin antibiotic for bacterial infections.',
        location: 'Shelf A2',
        initialQty: 18, // LOW STOCK (< 30)
      },
      {
        medicineId: 'MED-1003',
        medicineName: 'Cetirizine 10mg',
        genericName: 'Cetirizine HCl',
        category: 'Antihistamines',
        dosageForm: 'Tablet',
        supplier: createdSuppliers[2]._id,
        batchNumber: 'BATCH-CTZ-045',
        manufacturingDate: subDays(300),
        expiryDate: addDays(18), // NEAR EXPIRY (< 30 days)
        unitPrice: 8.75,
        costPrice: 4.2,
        reorderLevel: 25,
        description: 'Allergy relief for hay fever, watery eyes, and hives.',
        location: 'Shelf B1',
        initialQty: 85, // In Stock but Near Expiry
      },
      {
        medicineId: 'MED-1004',
        medicineName: 'Ibuprofen 400mg',
        genericName: 'Ibuprofen',
        category: 'Analgesics',
        dosageForm: 'Tablet',
        supplier: createdSuppliers[0]._id,
        batchNumber: 'BATCH-IBU-782',
        manufacturingDate: subDays(400),
        expiryDate: subDays(15), // EXPIRED
        unitPrice: 6.2,
        costPrice: 3.1,
        reorderLevel: 40,
        description: 'Non-steroidal anti-inflammatory drug for pain and swelling.',
        location: 'Shelf Quarantine-X',
        initialQty: 45, // In Stock but Expired
      },
      {
        medicineId: 'MED-1005',
        medicineName: 'Pantoprazole 40mg',
        genericName: 'Pantoprazole Sodium',
        category: 'Gastrointestinal',
        dosageForm: 'Tablet',
        supplier: createdSuppliers[3]._id,
        batchNumber: 'BATCH-PAN-330',
        manufacturingDate: subDays(120),
        expiryDate: addDays(500), // Valid
        unitPrice: 18.5,
        costPrice: 11.0,
        reorderLevel: 20,
        description: 'Proton-pump inhibitor for acid reflux, GERD, and ulcers.',
        location: 'Shelf B2',
        initialQty: 0, // OUT OF STOCK
      },
      {
        medicineId: 'MED-1006',
        medicineName: 'Azithromycin 250mg',
        genericName: 'Azithromycin',
        category: 'Antibiotics',
        dosageForm: 'Tablet',
        supplier: createdSuppliers[1]._id,
        batchNumber: 'BATCH-AZM-901',
        manufacturingDate: subDays(150),
        expiryDate: addDays(22), // NEAR EXPIRY (< 30 days)
        unitPrice: 22.0,
        costPrice: 14.5,
        reorderLevel: 15,
        description: 'Macrolide antibiotic for respiratory and skin infections.',
        location: 'Shelf A3',
        initialQty: 9, // LOW STOCK & NEAR EXPIRY
      },
      {
        medicineId: 'MED-1007',
        medicineName: 'Metformin 500mg',
        genericName: 'Metformin Hydrochloride',
        category: 'Antidiabetic',
        dosageForm: 'Tablet',
        supplier: createdSuppliers[4]._id,
        batchNumber: 'BATCH-MET-554',
        manufacturingDate: subDays(90),
        expiryDate: addDays(600), // Valid
        unitPrice: 7.0,
        costPrice: 3.5,
        reorderLevel: 40,
        description: 'First-line medication for the treatment of type 2 diabetes.',
        location: 'Shelf C1',
        initialQty: 180, // In Stock
      },
      {
        medicineId: 'MED-1008',
        medicineName: 'Atorvastatin 20mg',
        genericName: 'Atorvastatin Calcium',
        category: 'Cardiovascular',
        dosageForm: 'Tablet',
        supplier: createdSuppliers[4]._id,
        batchNumber: 'BATCH-ATV-882',
        manufacturingDate: subDays(200),
        expiryDate: addDays(450), // Valid
        unitPrice: 19.5,
        costPrice: 12.0,
        reorderLevel: 25,
        description: 'Statin medication to prevent cardiovascular disease and lower lipid levels.',
        location: 'Shelf C2',
        initialQty: 95, // In Stock
      },
      {
        medicineId: 'MED-1009',
        medicineName: 'Cough Reliever Expectorant',
        genericName: 'Guaifenesin & Dextromethorphan',
        category: 'Respiratory',
        dosageForm: 'Syrup',
        supplier: createdSuppliers[2]._id,
        batchNumber: 'BATCH-CGH-102',
        manufacturingDate: subDays(100),
        expiryDate: addDays(280), // Valid
        unitPrice: 11.5,
        costPrice: 6.0,
        reorderLevel: 20,
        description: 'Soothing syrup for chest congestion and dry persistent cough.',
        location: 'Shelf D1',
        initialQty: 60, // In Stock
      },
      {
        medicineId: 'MED-1010',
        medicineName: 'Vitamin D3 60,000 IU',
        genericName: 'Cholecalciferol',
        category: 'Vitamins & Supplements',
        dosageForm: 'Capsule',
        supplier: createdSuppliers[3]._id,
        batchNumber: 'BATCH-VTD-410',
        manufacturingDate: subDays(60),
        expiryDate: addDays(700), // Valid
        unitPrice: 12.0,
        costPrice: 5.8,
        reorderLevel: 30,
        description: 'Weekly supplement for bone density and immune strength.',
        location: 'Shelf D2',
        initialQty: 140, // In Stock
      },
      {
        medicineId: 'MED-1011',
        medicineName: 'Hydrocortisone 1% Cream',
        genericName: 'Hydrocortisone',
        category: 'Dermatology',
        dosageForm: 'Ointment',
        supplier: createdSuppliers[2]._id,
        batchNumber: 'BATCH-HDC-612',
        manufacturingDate: subDays(360),
        expiryDate: subDays(45), // EXPIRED
        unitPrice: 9.25,
        costPrice: 4.5,
        reorderLevel: 15,
        description: 'Topical corticosteroid for itching, redness, and eczema.',
        location: 'Shelf Quarantine-X',
        initialQty: 20, // Expired
      },
      {
        medicineId: 'MED-1012',
        medicineName: 'Salbutamol 100mcg Inhaler',
        genericName: 'Albuterol Sulfate',
        category: 'Respiratory',
        dosageForm: 'Inhaler',
        supplier: createdSuppliers[4]._id,
        batchNumber: 'BATCH-SBM-993',
        manufacturingDate: subDays(80),
        expiryDate: addDays(520), // Valid
        unitPrice: 28.0,
        costPrice: 17.5,
        reorderLevel: 20,
        description: 'Fast-acting bronchodilator for asthma relief and bronchospasm.',
        location: 'Shelf D3',
        initialQty: 12, // LOW STOCK (< 20)
      },
    ];

    const createdMedicines = [];
    const createdStocks = [];
    const initialTransactions = [];

    let medIndex = 0;
    for (const item of medicinesData) {
      const { initialQty, ...medFields } = item;
      const medicine = await Medicine.create(medFields);
      createdMedicines.push(medicine);

      // Create matching stock
      const stockId = `STK-${(1001 + medIndex).toString()}`;
      const stock = await Stock.create({
        stockId,
        medicine: medicine._id,
        quantity: initialQty,
        reorderLevel: medicine.reorderLevel,
        location: medicine.location,
        lastUpdated: new Date(),
      });
      createdStocks.push(stock);

      // Record initial purchase intake transaction if qty > 0
      if (initialQty > 0) {
        const txnId = `TXN-2026-${(1001 + initialTransactions.length).toString()}`;
        const txn = await Transaction.create({
          transactionId: txnId,
          transactionType: 'PURCHASE',
          medicine: medicine._id,
          quantity: initialQty + 20, // received more earlier
          unitPrice: medicine.costPrice,
          totalAmount: Number(((initialQty + 20) * medicine.costPrice).toFixed(2)),
          supplier: medicine.supplier,
          user: adminUser._id,
          notes: 'Opening inventory shipment',
          transactionDate: subDays(Math.floor(Math.random() * 20) + 5),
        });
        initialTransactions.push(txn);
      }

      medIndex++;
    }

    console.log(`[Seed]: Created ${createdMedicines.length} medicines and stocks.`);

    // 4. Create Realistic Sales Transactions across the last 7 days
    const salesData = [
      {
        med: createdMedicines[0], // Paracetamol
        qty: 10,
        customer: 'John Doe',
        daysAgo: 6,
      },
      {
        med: createdMedicines[6], // Metformin
        qty: 4,
        customer: 'Alice Smith',
        daysAgo: 5,
      },
      {
        med: createdMedicines[7], // Atorvastatin
        qty: 5,
        customer: 'Robert Brown',
        daysAgo: 4,
      },
      {
        med: createdMedicines[8], // Cough Reliever
        qty: 3,
        customer: 'Mary Johnson',
        daysAgo: 3,
      },
      {
        med: createdMedicines[0], // Paracetamol
        qty: 8,
        customer: 'David Clark',
        daysAgo: 2,
      },
      {
        med: createdMedicines[9], // Vitamin D3
        qty: 6,
        customer: 'Jessica White',
        daysAgo: 1,
      },
      {
        med: createdMedicines[7], // Atorvastatin
        qty: 2,
        customer: 'William Green',
        daysAgo: 0,
      },
      {
        med: createdMedicines[0], // Paracetamol
        qty: 12,
        customer: 'Sarah Davis',
        daysAgo: 0,
      },
    ];

    for (const s of salesData) {
      const txnId = `TXN-2026-${(1001 + initialTransactions.length).toString()}`;
      const totalAmount = Number((s.qty * s.med.unitPrice).toFixed(2));
      const saleTxn = await Transaction.create({
        transactionId: txnId,
        transactionType: 'SALE',
        medicine: s.med._id,
        quantity: s.qty,
        unitPrice: s.med.unitPrice,
        totalAmount,
        customerName: s.customer,
        customerPhone: '+1 (555) 432-1099',
        user: staffUser._id,
        notes: 'Counter prescription dispensing',
        transactionDate: subDays(s.daysAgo),
      });
      initialTransactions.push(saleTxn);
    }

    console.log(`[Seed]: Created ${initialTransactions.length} total transactions.`);

    // 5. Create System Settings
    await Setting.create({
      pharmacyName: 'Apex MediCare Pharmacy',
      tagline: 'Healthcare & Medicine Inventory Management System',
      address: '104 Healthcare Bhavan, Medical Enclave, Bandra West, Mumbai, Maharashtra 400050',
      phone: '+91 98200 12345',
      email: 'support@apexmedicare.in',
      currency: 'INR (₹)',
      currencySymbol: '₹',
      taxRate: 5.0,
      defaultReorderLevel: 20,
      expiryWarningDays: 30,
    });

    console.log('[Seed]: Pharmacy settings configured.');
    console.log('----------------------------------------------------');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('Admin Demo Login:      admin@medinventory.com / Admin@123');
    console.log('Pharmacist Demo Login: pharmacist@medinventory.com / Pharm@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
