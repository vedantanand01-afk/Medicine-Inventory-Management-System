const Medicine = require('../models/Medicine');
const Stock = require('../models/Stock');
const Supplier = require('../models/Supplier');
const Transaction = require('../models/Transaction');

// @desc    Get top dashboard statistics calculated live from MongoDB
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAhead = new Date(today);
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    // 1. Total Medicines
    const totalMedicines = await Medicine.countDocuments();

    // 2. Stock aggregations
    const stocks = await Stock.find();
    const totalStock = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const lowStockItems = stocks.filter(
      (s) => s.quantity > 0 && s.quantity <= s.reorderLevel
    ).length;
    const outOfStockItems = stocks.filter((s) => s.quantity === 0).length;

    // 3. Expiry aggregations
    const medicines = await Medicine.find();
    let expiredItems = 0;
    let nearExpiryItems = 0;

    medicines.forEach((med) => {
      const exp = new Date(med.expiryDate);
      exp.setHours(0, 0, 0, 0);
      if (exp < today) {
        expiredItems++;
      } else if (exp <= thirtyDaysAhead) {
        nearExpiryItems++;
      }
    });

    // 4. Supplier count
    const totalSuppliers = await Supplier.countDocuments();

    // 5. Sales today and overall revenue
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transactions = await Transaction.find();
    const salesToday = transactions
      .filter(
        (t) =>
          t.transactionType === 'SALE' &&
          new Date(t.transactionDate) >= today &&
          new Date(t.transactionDate) < tomorrow
      )
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const totalSalesRevenue = transactions
      .filter((t) => t.transactionType === 'SALE')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const totalPurchaseExpenditure = transactions
      .filter((t) => t.transactionType === 'PURCHASE')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const totalTransactionsCount = transactions.length;

    res.status(200).json({
      success: true,
      data: {
        totalMedicines,
        totalStock,
        lowStockItems,
        outOfStockItems,
        expiredItems,
        nearExpiryItems,
        totalSuppliers,
        salesToday: Number(salesToday.toFixed(2)),
        totalSalesRevenue: Number(totalSalesRevenue.toFixed(2)),
        totalPurchaseExpenditure: Number(totalPurchaseExpenditure.toFixed(2)),
        totalTransactionsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock overview by category and status
// @route   GET /api/dashboard/stock-overview
// @access  Private
exports.getStockOverview = async (req, res, next) => {
  try {
    const medicines = await Medicine.find().populate('stock');

    // Group by category
    const categoryMap = {};
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    medicines.forEach((med) => {
      const cat = med.category || 'Other';
      const qty = med.stock ? med.stock.quantity : 0;
      const reorder = med.reorderLevel || 20;

      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, medicineCount: 0, totalUnits: 0 };
      }
      categoryMap[cat].medicineCount += 1;
      categoryMap[cat].totalUnits += qty;

      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty <= reorder) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    const categoryData = Object.values(categoryMap);

    res.status(200).json({
      success: true,
      data: {
        categoryDistribution: categoryData,
        stockStatusDistribution: [
          { status: 'In Stock', count: inStockCount, color: '#10B981' },
          { status: 'Low Stock', count: lowStockCount, color: '#F59E0B' },
          { status: 'Out of Stock', count: outOfStockCount, color: '#EF4444' },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales and transaction trend (e.g. past 7 days)
// @route   GET /api/dashboard/sales-trend
// @access  Private
exports.getSalesTrend = async (req, res, next) => {
  try {
    const days = 7;
    const trend = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayTransactions = await Transaction.find({
        transactionDate: { $gte: d, $lt: nextD },
      });

      const sales = dayTransactions
        .filter((t) => t.transactionType === 'SALE')
        .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

      const purchases = dayTransactions
        .filter((t) => t.transactionType === 'PURCHASE')
        .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

      trend.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: d.toISOString().split('T')[0],
        sales: Number(sales.toFixed(2)),
        purchases: Number(purchases.toFixed(2)),
        transactionCount: dayTransactions.length,
      });
    }

    res.status(200).json({
      success: true,
      data: trend,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent transactions for dashboard
// @route   GET /api/dashboard/recent-transactions
// @access  Private
exports.getRecentTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate('medicine', 'medicineId medicineName category')
      .populate('user', 'name userId role')
      .populate('supplier', 'supplierName')
      .sort('-transactionDate')
      .limit(8);

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};
