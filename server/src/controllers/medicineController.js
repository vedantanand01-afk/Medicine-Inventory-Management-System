const Medicine = require('../models/Medicine');
const Stock = require('../models/Stock');
const Supplier = require('../models/Supplier');
const Transaction = require('../models/Transaction');

// Helper to compute expiry & stock status
const computeStatuses = (medicineDoc, stockDoc) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(medicineDoc.expiryDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate - today;
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let expiryStatus = 'valid';
  if (daysUntilExpiry < 0) {
    expiryStatus = 'expired';
  } else if (daysUntilExpiry <= 30) {
    expiryStatus = 'near_expiry';
  }

  const quantity = stockDoc ? stockDoc.quantity : 0;
  const reorderLevel = medicineDoc.reorderLevel || 20;

  let stockStatus = 'in_stock';
  if (quantity <= 0) {
    stockStatus = 'out_of_stock';
  } else if (quantity <= reorderLevel) {
    stockStatus = 'low_stock';
  }

  return {
    daysUntilExpiry,
    expiryStatus,
    stockStatus,
    currentStock: quantity,
  };
};

// @desc    Get all medicines with search, filters, sorting & pagination
// @route   GET /api/medicines
// @access  Private
exports.getMedicines = async (req, res, next) => {
  try {
    const {
      search,
      category,
      supplier,
      stockStatus,
      expiryStatus,
      sort = '-createdAt',
      page,
      limit,
    } = req.query;

    let query = {};

    // Search query
    if (search) {
      query.$or = [
        { medicineName: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { medicineId: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (supplier && supplier !== 'All') {
      query.supplier = supplier;
    }

    // Fetch matching medicines with populated supplier and virtual stock
    let medicines = await Medicine.find(query)
      .populate('supplier', 'supplierId supplierName contactPerson phone email')
      .populate('stock')
      .sort(sort);

    // Attach computed statuses to all medicines
    let enriched = medicines.map((med) => {
      const computed = computeStatuses(med, med.stock);
      return {
        ...med.toObject(),
        ...computed,
      };
    });

    // Filter by stockStatus if specified
    if (stockStatus && stockStatus !== 'All') {
      enriched = enriched.filter((m) => m.stockStatus === stockStatus);
    }

    // Filter by expiryStatus if specified
    if (expiryStatus && expiryStatus !== 'All') {
      enriched = enriched.filter((m) => m.expiryStatus === expiryStatus);
    }

    const total = enriched.length;

    // Apply pagination if specified
    let paginatedData = enriched;
    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;
      paginatedData = enriched.slice(skip, skip + limitNum);
    }

    res.status(200).json({
      success: true,
      count: paginatedData.length,
      total,
      data: paginatedData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single medicine details with full stock & transaction history
// @route   GET /api/medicines/:id
// @access  Private
exports.getMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id)
      .populate('supplier')
      .populate('stock');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    const computed = computeStatuses(medicine, medicine.stock);

    // Get recent transactions for this medicine
    const recentTransactions = await Transaction.find({ medicine: medicine._id })
      .populate('user', 'name userId email')
      .sort('-transactionDate')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        ...medicine.toObject(),
        ...computed,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new medicine and initialize stock record
// @route   POST /api/medicines
// @access  Private
exports.createMedicine = async (req, res, next) => {
  try {
    let {
      medicineId,
      medicineName,
      genericName,
      category,
      dosageForm,
      supplier,
      batchNumber,
      manufacturingDate,
      expiryDate,
      unitPrice,
      costPrice,
      reorderLevel,
      description,
      location,
      initialQuantity = 0,
    } = req.body;

    // Basic validations
    if (
      !medicineName ||
      !category ||
      !supplier ||
      !batchNumber ||
      !manufacturingDate ||
      !expiryDate ||
      unitPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide all required fields: name, category, supplier, batch number, dates, and unit price',
      });
    }

    const mfg = new Date(manufacturingDate);
    const exp = new Date(expiryDate);

    if (exp <= mfg) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be later than the manufacturing date',
      });
    }

    if (Number(unitPrice) < 0 || Number(initialQuantity) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit price and quantity cannot be negative',
      });
    }

    // Verify supplier exists
    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) {
      return res.status(400).json({
        success: false,
        message: 'Selected supplier does not exist',
      });
    }

    // Auto-generate medicineId if not supplied
    if (!medicineId) {
      const count = await Medicine.countDocuments();
      medicineId = `MED-${(count + 1001).toString()}`;
    }

    const existingMedicine = await Medicine.findOne({
      $or: [
        { medicineId: medicineId.toUpperCase() },
        { batchNumber: batchNumber.toUpperCase() },
      ],
    });

    if (existingMedicine) {
      return res.status(400).json({
        success: false,
        message:
          existingMedicine.medicineId === medicineId.toUpperCase()
            ? `Medicine ID '${medicineId}' already exists`
            : `Batch number '${batchNumber}' is already registered with another medicine`,
      });
    }

    const medicine = await Medicine.create({
      medicineId: medicineId.toUpperCase(),
      medicineName,
      genericName: genericName || '',
      category,
      dosageForm: dosageForm || 'Tablet',
      supplier,
      batchNumber: batchNumber.toUpperCase(),
      manufacturingDate: mfg,
      expiryDate: exp,
      unitPrice: Number(unitPrice),
      costPrice: Number(costPrice) || 0,
      reorderLevel: Number(reorderLevel) || 20,
      description: description || '',
      location: location || 'Shelf A1',
    });

    // Create 1:1 Stock document
    const stockCount = await Stock.countDocuments();
    const stockId = `STK-${(stockCount + 1001).toString()}`;

    const stock = await Stock.create({
      stockId,
      medicine: medicine._id,
      quantity: Number(initialQuantity) || 0,
      reorderLevel: Number(reorderLevel) || 20,
      location: location || 'Shelf A1',
    });

    // If initial quantity > 0, create an initial PURCHASE transaction
    if (Number(initialQuantity) > 0) {
      const txnCount = await Transaction.countDocuments();
      const transactionId = `TXN-${new Date().getFullYear()}-${(
        txnCount + 1001
      ).toString()}`;

      await Transaction.create({
        transactionId,
        transactionType: 'PURCHASE',
        medicine: medicine._id,
        quantity: Number(initialQuantity),
        unitPrice: Number(costPrice) || Number(unitPrice),
        totalAmount:
          (Number(costPrice) || Number(unitPrice)) * Number(initialQuantity),
        supplier: supplierDoc._id,
        user: req.user._id,
        notes: 'Initial opening stock intake',
      });
    }

    const createdMedicine = await Medicine.findById(medicine._id)
      .populate('supplier')
      .populate('stock');

    const computed = computeStatuses(createdMedicine, stock);

    res.status(201).json({
      success: true,
      message: 'Medicine and stock record created successfully',
      data: {
        ...createdMedicine.toObject(),
        ...computed,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private
exports.updateMedicine = async (req, res, next) => {
  try {
    let medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    if (req.body.manufacturingDate && req.body.expiryDate) {
      if (new Date(req.body.expiryDate) <= new Date(req.body.manufacturingDate)) {
        return res.status(400).json({
          success: false,
          message: 'Expiry date must be later than the manufacturing date',
        });
      }
    }

    medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('supplier')
      .populate('stock');

    // Also sync reorderLevel and location with Stock document if provided
    if (req.body.reorderLevel !== undefined || req.body.location) {
      const updateData = {};
      if (req.body.reorderLevel !== undefined) {
        updateData.reorderLevel = Number(req.body.reorderLevel);
      }
      if (req.body.location) {
        updateData.location = req.body.location;
      }
      await Stock.findOneAndUpdate({ medicine: medicine._id }, updateData);
    }

    const updatedStock = await Stock.findOne({ medicine: medicine._id });
    const computed = computeStatuses(medicine, updatedStock);

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: {
        ...medicine.toObject(),
        ...computed,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete medicine and associated stock
// @route   DELETE /api/medicines/:id
// @access  Private (Admin only)
exports.deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    // Delete associated stock record
    await Stock.findOneAndDelete({ medicine: medicine._id });

    // Delete medicine
    await medicine.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Medicine and associated stock deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get medicine categories list
// @route   GET /api/medicines/categories
// @access  Private
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Medicine.distinct('category');
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};
