const Transaction = require('../models/Transaction');
const Medicine = require('../models/Medicine');
const Stock = require('../models/Stock');

// @desc    Get transaction history with filters, search, and pagination
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      medicine,
      startDate,
      endDate,
      search,
      sort = '-transactionDate',
      page,
      limit,
    } = req.query;

    let query = {};

    if (type && type !== 'All') {
      query.transactionType = type;
    }

    if (medicine && medicine !== 'All') {
      query.medicine = medicine;
    }

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    let transactionsQuery = Transaction.find(query)
      .populate('medicine', 'medicineId medicineName batchNumber category unitPrice')
      .populate('supplier', 'supplierId supplierName')
      .populate('user', 'userId name email role')
      .sort(sort);

    let transactions = await transactionsQuery;

    // Filter by search string if provided
    if (search) {
      const q = search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.transactionId.toLowerCase().includes(q) ||
          (t.medicine && t.medicine.medicineName.toLowerCase().includes(q)) ||
          (t.medicine && t.medicine.medicineId.toLowerCase().includes(q)) ||
          (t.customerName && t.customerName.toLowerCase().includes(q)) ||
          (t.user && t.user.name.toLowerCase().includes(q))
      );
    }

    const total = transactions.length;

    let paginatedData = transactions;
    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;
      paginatedData = transactions.slice(skip, skip + limitNum);
    }

    // Calculate summary statistics for filtered results
    const totalSalesAmount = transactions
      .filter((t) => t.transactionType === 'SALE')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const totalPurchaseAmount = transactions
      .filter((t) => t.transactionType === 'PURCHASE')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      count: paginatedData.length,
      total,
      summary: {
        totalSalesAmount,
        totalPurchaseAmount,
        totalCount: total,
      },
      data: paginatedData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction details
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('medicine')
      .populate('supplier')
      .populate('user', 'userId name email role');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Sale transaction (or bulk checkout)
// @route   POST /api/transactions
// @access  Private
exports.createSaleTransaction = async (req, res, next) => {
  try {
    const {
      medicineId,
      quantity,
      unitPrice,
      customerName,
      customerPhone,
      notes,
    } = req.body;

    // 1. Basic validation
    if (!medicineId || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid medicine and enter a positive quantity',
      });
    }

    const qty = Number(quantity);

    // 2. Verify medicine exists
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in database',
      });
    }

    // 3. Verify medicine is NOT expired
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(medicine.expiryDate);
    expDate.setHours(0, 0, 0, 0);

    if (expDate < today) {
      return res.status(400).json({
        success: false,
        message: `Cannot process sale: '${medicine.medicineName}' has EXPIRED on ${expDate.toISOString().split('T')[0]}. Expired medicines cannot be sold.`,
      });
    }

    // 4. Atomically verify and reduce stock
    const updatedStock = await Stock.findOneAndUpdate(
      {
        medicine: medicine._id,
        quantity: { $gte: qty },
      },
      {
        $inc: { quantity: -qty },
        $set: { lastUpdated: new Date() },
      },
      { new: true }
    );

    if (!updatedStock) {
      const currentStock = await Stock.findOne({ medicine: medicine._id });
      const available = currentStock ? currentStock.quantity : 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for '${medicine.medicineName}'. Requested: ${qty}, Available: ${available}`,
      });
    }

    // 5. Calculate total & create transaction record
    const price = unitPrice !== undefined ? Number(unitPrice) : medicine.unitPrice;
    const totalAmount = Number((price * qty).toFixed(2));

    const txnCount = await Transaction.countDocuments();
    const transactionId = `TXN-${new Date().getFullYear()}-${(
      txnCount + 1001
    ).toString()}`;

    const transaction = await Transaction.create({
      transactionId,
      transactionType: 'SALE',
      medicine: medicine._id,
      quantity: qty,
      unitPrice: price,
      totalAmount,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      user: req.user._id,
      notes: notes || '',
    });

    const populatedTxn = await Transaction.findById(transaction._id)
      .populate('medicine', 'medicineId medicineName category batchNumber')
      .populate('user', 'userId name email');

    res.status(201).json({
      success: true,
      message: `Sale completed successfully for ${qty} unit(s) of ${medicine.medicineName}`,
      data: {
        transaction: populatedTxn,
        remainingStock: updatedStock.quantity,
      },
    });
  } catch (error) {
    next(error);
  }
};
