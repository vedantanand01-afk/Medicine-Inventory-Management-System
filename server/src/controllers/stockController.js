const Stock = require('../models/Stock');
const Medicine = require('../models/Medicine');
const Transaction = require('../models/Transaction');

// Helper to determine status
const getStockStatus = (quantity, reorderLevel) => {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= reorderLevel) return 'low_stock';
  return 'in_stock';
};

// @desc    Get all stock inventory records
// @route   GET /api/stock
// @access  Private
exports.getAllStock = async (req, res, next) => {
  try {
    const { search, status, sort = '-quantity' } = req.query;

    const stocks = await Stock.find()
      .populate({
        path: 'medicine',
        populate: { path: 'supplier', select: 'supplierName supplierId' },
      })
      .sort(sort);

    // Filter out any orphaned stocks and apply search & status filter
    let results = stocks
      .filter((s) => s.medicine !== null)
      .map((s) => {
        const statusVal = getStockStatus(s.quantity, s.reorderLevel);
        return {
          ...s.toObject(),
          status: statusVal,
        };
      });

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (s) =>
          s.stockId.toLowerCase().includes(q) ||
          s.medicine.medicineName.toLowerCase().includes(q) ||
          s.medicine.medicineId.toLowerCase().includes(q) ||
          s.medicine.batchNumber.toLowerCase().includes(q) ||
          s.medicine.category.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'All') {
      results = results.filter((s) => s.status === status);
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stock In (Purchase/Restock shipment)
// @route   POST /api/stock/in
// @access  Private
exports.stockIn = async (req, res, next) => {
  try {
    const { medicineId, quantity, unitCost, supplierId, notes } = req.body;

    if (!medicineId || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid medicine and positive quantity to restock',
      });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    const qty = Number(quantity);
    const cost = unitCost ? Number(unitCost) : medicine.costPrice || medicine.unitPrice;

    // Atomically increment stock
    let stock = await Stock.findOneAndUpdate(
      { medicine: medicine._id },
      {
        $inc: { quantity: qty },
        $set: { lastUpdated: new Date() },
      },
      { new: true, upsert: true }
    );

    // Create PURCHASE transaction
    const txnCount = await Transaction.countDocuments();
    const transactionId = `TXN-${new Date().getFullYear()}-${(
      txnCount + 1001
    ).toString()}`;

    const transaction = await Transaction.create({
      transactionId,
      transactionType: 'PURCHASE',
      medicine: medicine._id,
      quantity: qty,
      unitPrice: cost,
      totalAmount: cost * qty,
      supplier: supplierId || medicine.supplier,
      user: req.user._id,
      notes: notes || 'Stock-in restocking shipment',
    });

    const populatedStock = await Stock.findById(stock._id).populate({
      path: 'medicine',
      populate: { path: 'supplier' },
    });

    res.status(200).json({
      success: true,
      message: `Successfully restocked ${qty} units of ${medicine.medicineName}`,
      data: {
        stock: {
          ...populatedStock.toObject(),
          status: getStockStatus(populatedStock.quantity, populatedStock.reorderLevel),
        },
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stock Out (Adjustment/Disposal/Issue)
// @route   POST /api/stock/out
// @access  Private
exports.stockOut = async (req, res, next) => {
  try {
    const { medicineId, quantity, reason, notes } = req.body;

    if (!medicineId || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid medicine and positive quantity to remove',
      });
    }

    const qty = Number(quantity);

    // Atomic stock reduction with safety check (cannot go below 0)
    const stock = await Stock.findOneAndUpdate(
      {
        medicine: medicineId,
        quantity: { $gte: qty },
      },
      {
        $inc: { quantity: -qty },
        $set: { lastUpdated: new Date() },
      },
      { new: true }
    );

    if (!stock) {
      // Check current quantity to return helpful message
      const currentStock = await Stock.findOne({ medicine: medicineId });
      const available = currentStock ? currentStock.quantity : 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Requested: ${qty}, Available: ${available}`,
      });
    }

    const medicine = await Medicine.findById(medicineId);

    // Create ADJUSTMENT transaction
    const txnCount = await Transaction.countDocuments();
    const transactionId = `TXN-${new Date().getFullYear()}-${(
      txnCount + 1001
    ).toString()}`;

    const transaction = await Transaction.create({
      transactionId,
      transactionType: 'ADJUSTMENT',
      medicine: medicine._id,
      quantity: qty,
      unitPrice: medicine.unitPrice,
      totalAmount: medicine.unitPrice * qty,
      user: req.user._id,
      notes: `${reason || 'Manual stock deduction'}: ${notes || 'No extra notes'}`,
    });

    const populatedStock = await Stock.findById(stock._id).populate({
      path: 'medicine',
      populate: { path: 'supplier' },
    });

    res.status(200).json({
      success: true,
      message: `Successfully deducted ${qty} units of ${medicine.medicineName}`,
      data: {
        stock: {
          ...populatedStock.toObject(),
          status: getStockStatus(populatedStock.quantity, populatedStock.reorderLevel),
        },
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock medicines list
// @route   GET /api/stock/low
// @access  Private
exports.getLowStock = async (req, res, next) => {
  try {
    const stocks = await Stock.find()
      .populate({
        path: 'medicine',
        populate: { path: 'supplier' },
      })
      .sort('quantity');

    const lowStockItems = stocks
      .filter((s) => s.medicine !== null && s.quantity <= s.reorderLevel)
      .map((s) => ({
        ...s.toObject(),
        status: s.quantity === 0 ? 'out_of_stock' : 'low_stock',
      }));

    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems,
    });
  } catch (error) {
    next(error);
  }
};
