const Medicine = require('../models/Medicine');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');

// @desc    Get comprehensive inventory report
// @route   GET /api/reports/inventory
// @access  Private
exports.getInventoryReport = async (req, res, next) => {
  try {
    const medicines = await Medicine.find()
      .populate('supplier', 'supplierName supplierId')
      .populate('stock');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalStockUnits = 0;
    let totalRetailValue = 0;
    let totalCostValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiredCount = 0;

    const items = medicines.map((med) => {
      const qty = med.stock ? med.stock.quantity : 0;
      const reorder = med.reorderLevel || 20;
      const exp = new Date(med.expiryDate);
      exp.setHours(0, 0, 0, 0);

      const isExpired = exp < today;
      const isLow = qty > 0 && qty <= reorder;
      const isOut = qty === 0;

      if (isExpired) expiredCount++;
      if (isLow) lowStockCount++;
      if (isOut) outOfStockCount++;

      totalStockUnits += qty;
      totalRetailValue += qty * (med.unitPrice || 0);
      totalCostValue += qty * (med.costPrice || 0);

      return {
        _id: med._id,
        medicineId: med.medicineId,
        medicineName: med.medicineName,
        category: med.category,
        supplierName: med.supplier ? med.supplier.supplierName : 'N/A',
        batchNumber: med.batchNumber,
        expiryDate: med.expiryDate,
        quantity: qty,
        unitPrice: med.unitPrice,
        costPrice: med.costPrice,
        reorderLevel: med.reorderLevel,
        location: med.location,
        totalValue: qty * (med.unitPrice || 0),
        status: isOut
          ? 'Out of Stock'
          : isLow
          ? 'Low Stock'
          : isExpired
          ? 'Expired'
          : 'In Stock',
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalMedicines: medicines.length,
          totalStockUnits,
          totalRetailValue: Number(totalRetailValue.toFixed(2)),
          totalCostValue: Number(totalCostValue.toFixed(2)),
          estimatedMargin: Number(
            (totalRetailValue - totalCostValue).toFixed(2)
          ),
          lowStockCount,
          outOfStockCount,
          expiredCount,
        },
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive sales report
// @route   GET /api/reports/sales
// @access  Private
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { transactionType: 'SALE' };
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    const sales = await Transaction.find(query)
      .populate('medicine', 'medicineId medicineName category unitPrice')
      .populate('user', 'name userId')
      .sort('-transactionDate');

    const totalSalesAmount = sales.reduce(
      (sum, s) => sum + (s.totalAmount || 0),
      0
    );
    const totalUnitsSold = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    // Group sales by medicine for top-sellers
    const medicineSalesMap = {};
    sales.forEach((s) => {
      const medName = s.medicine ? s.medicine.medicineName : 'Unknown';
      const medId = s.medicine ? s.medicine.medicineId : 'N/A';
      if (!medicineSalesMap[medName]) {
        medicineSalesMap[medName] = {
          medicineId: medId,
          medicineName: medName,
          totalUnits: 0,
          totalRevenue: 0,
          transactionCount: 0,
        };
      }
      medicineSalesMap[medName].totalUnits += s.quantity || 0;
      medicineSalesMap[medName].totalRevenue += s.totalAmount || 0;
      medicineSalesMap[medName].transactionCount += 1;
    });

    const topSellingMedicines = Object.values(medicineSalesMap).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTransactions: sales.length,
          totalUnitsSold,
          totalSalesAmount: Number(totalSalesAmount.toFixed(2)),
          averageOrderValue:
            sales.length > 0
              ? Number((totalSalesAmount / sales.length).toFixed(2))
              : 0,
        },
        topSellingMedicines,
        transactions: sales,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock movement report (Purchases vs Sales)
// @route   GET /api/reports/movement
// @access  Private
exports.getMovementReport = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate('medicine', 'medicineId medicineName category')
      .populate('supplier', 'supplierName')
      .populate('user', 'name')
      .sort('-transactionDate');

    let totalStockReceivedUnits = 0;
    let totalStockReceivedAmount = 0;
    let totalStockIssuedUnits = 0;
    let totalStockIssuedAmount = 0;

    transactions.forEach((t) => {
      if (t.transactionType === 'PURCHASE') {
        totalStockReceivedUnits += t.quantity || 0;
        totalStockReceivedAmount += t.totalAmount || 0;
      } else if (t.transactionType === 'SALE') {
        totalStockIssuedUnits += t.quantity || 0;
        totalStockIssuedAmount += t.totalAmount || 0;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalStockReceivedUnits,
          totalStockReceivedAmount: Number(
            totalStockReceivedAmount.toFixed(2)
          ),
          totalStockIssuedUnits,
          totalStockIssuedAmount: Number(totalStockIssuedAmount.toFixed(2)),
          netUnitMovement: totalStockReceivedUnits - totalStockIssuedUnits,
        },
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expiry forecast report
// @route   GET /api/reports/expiry
// @access  Private
exports.getExpiryReport = async (req, res, next) => {
  try {
    const medicines = await Medicine.find()
      .populate('supplier', 'supplierName contactPerson phone')
      .populate('stock');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const sixtyDays = new Date(today);
    sixtyDays.setDate(sixtyDays.getDate() + 60);

    const ninetyDays = new Date(today);
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    const expired = [];
    const expiringIn30Days = [];
    const expiringIn60Days = [];
    const expiringIn90Days = [];

    let expiredValueLost = 0;
    let nearExpiryValueAtRisk = 0;

    medicines.forEach((med) => {
      const exp = new Date(med.expiryDate);
      exp.setHours(0, 0, 0, 0);
      const qty = med.stock ? med.stock.quantity : 0;
      const totalVal = qty * (med.unitPrice || 0);

      const diffTime = exp - today;
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const row = {
        ...med.toObject(),
        quantity: qty,
        totalVal,
        daysUntilExpiry,
      };

      if (exp < today) {
        expired.push(row);
        expiredValueLost += totalVal;
      } else if (exp <= thirtyDays) {
        expiringIn30Days.push(row);
        nearExpiryValueAtRisk += totalVal;
      } else if (exp <= sixtyDays) {
        expiringIn60Days.push(row);
      } else if (exp <= ninetyDays) {
        expiringIn90Days.push(row);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          expiredCount: expired.length,
          expiredValueLost: Number(expiredValueLost.toFixed(2)),
          expiringIn30DaysCount: expiringIn30Days.length,
          nearExpiryValueAtRisk: Number(nearExpiryValueAtRisk.toFixed(2)),
          expiringIn60DaysCount: expiringIn60Days.length,
          expiringIn90DaysCount: expiringIn90Days.length,
        },
        expired,
        expiringIn30Days,
        expiringIn60Days,
        expiringIn90Days,
      },
    });
  } catch (error) {
    next(error);
  }
};
