const Medicine = require('../models/Medicine');
const Stock = require('../models/Stock');

// @desc    Get low-stock and out-of-stock medicine alerts
// @route   GET /api/alerts/low-stock
// @access  Private
exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const stocks = await Stock.find()
      .populate({
        path: 'medicine',
        populate: { path: 'supplier', select: 'supplierName contactPerson phone email' },
      })
      .sort('quantity');

    const lowStockAlerts = stocks
      .filter((s) => s.medicine !== null && s.quantity <= s.reorderLevel)
      .map((s) => {
        const isOutOfStock = s.quantity === 0;
        const deficit = Math.max(0, s.reorderLevel - s.quantity);
        return {
          _id: s._id,
          stockId: s.stockId,
          medicine: s.medicine,
          quantity: s.quantity,
          reorderLevel: s.reorderLevel,
          location: s.location,
          deficit,
          status: isOutOfStock ? 'out_of_stock' : 'low_stock',
          severity: isOutOfStock ? 'critical' : 'warning',
          lastUpdated: s.lastUpdated,
        };
      });

    res.status(200).json({
      success: true,
      count: lowStockAlerts.length,
      data: lowStockAlerts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expired and near-expiry medicine alerts
// @route   GET /api/alerts/expiry
// @access  Private
exports.getExpiryAlerts = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAhead = new Date(today);
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    const medicines = await Medicine.find()
      .populate('supplier', 'supplierName contactPerson phone email')
      .populate('stock');

    const expiredList = [];
    const nearExpiryList = [];

    medicines.forEach((med) => {
      const expDate = new Date(med.expiryDate);
      expDate.setHours(0, 0, 0, 0);

      const diffTime = expDate - today;
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const currentStock = med.stock ? med.stock.quantity : 0;

      const item = {
        ...med.toObject(),
        daysUntilExpiry,
        currentStock,
        expiryFormatted: expDate.toISOString().split('T')[0],
      };

      if (daysUntilExpiry < 0) {
        expiredList.push({
          ...item,
          status: 'expired',
          severity: 'critical',
        });
      } else if (daysUntilExpiry <= 30) {
        nearExpiryList.push({
          ...item,
          status: 'near_expiry',
          severity: 'warning',
        });
      }
    });

    // Sort expired by oldest first, near expiry by soonest first
    expiredList.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    nearExpiryList.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    res.status(200).json({
      success: true,
      totalAlerts: expiredList.length + nearExpiryList.length,
      data: {
        expired: expiredList,
        nearExpiry: nearExpiryList,
        all: [...expiredList, ...nearExpiryList],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get summary counts for header notification badges
// @route   GET /api/alerts/summary
// @access  Private
exports.getAlertsSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAhead = new Date(today);
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    // Low stock count
    const stocks = await Stock.find();
    const lowStockCount = stocks.filter((s) => s.quantity <= s.reorderLevel).length;
    const outOfStockCount = stocks.filter((s) => s.quantity === 0).length;

    // Expiry counts
    const medicines = await Medicine.find();
    let expiredCount = 0;
    let nearExpiryCount = 0;

    medicines.forEach((med) => {
      const expDate = new Date(med.expiryDate);
      expDate.setHours(0, 0, 0, 0);
      if (expDate < today) {
        expiredCount++;
      } else if (expDate <= thirtyDaysAhead) {
        nearExpiryCount++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        lowStockCount,
        outOfStockCount,
        expiredCount,
        nearExpiryCount,
        totalAlerts: lowStockCount + expiredCount + nearExpiryCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
