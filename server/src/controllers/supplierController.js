const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');

// @desc    Get all suppliers with medicine count and search
// @route   GET /api/suppliers
// @access  Private
exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, sort = '-createdAt', page, limit } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { supplierName: { $regex: search, $options: 'i' } },
          { supplierId: { $regex: search, $options: 'i' } },
          { contactPerson: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      };
    }

    let supplierQuery = Supplier.find(query).sort(sort);

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;
      supplierQuery = supplierQuery.skip(skip).limit(limitNum);
    }

    const suppliers = await supplierQuery;
    const total = await Supplier.countDocuments(query);

    // Compute medicine count for each supplier
    const suppliersWithCounts = await Promise.all(
      suppliers.map(async (sup) => {
        const medicineCount = await Medicine.countDocuments({
          supplier: sup._id,
        });
        return {
          ...sup.toObject(),
          medicineCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: suppliersWithCounts.length,
      total,
      data: suppliersWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single supplier details with linked medicines
// @route   GET /api/suppliers/:id
// @access  Private
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    const medicines = await Medicine.find({ supplier: supplier._id }).populate(
      'stock'
    );

    res.status(200).json({
      success: true,
      data: {
        ...supplier.toObject(),
        medicines,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private (Admin & Pharmacist)
exports.createSupplier = async (req, res, next) => {
  try {
    let { supplierId, supplierName, contactPerson, phone, email, address } =
      req.body;

    if (!supplierName || !phone || !email || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide supplier name, phone, email, and address',
      });
    }

    if (!supplierId) {
      const count = await Supplier.countDocuments();
      supplierId = `SUP-${(count + 1001).toString()}`;
    }

    const existingSupplier = await Supplier.findOne({
      $or: [{ supplierId }, { email: email.toLowerCase() }],
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message:
          existingSupplier.supplierId === supplierId
            ? 'Supplier ID already exists'
            : 'A supplier with this email already exists',
      });
    }

    const supplier = await Supplier.create({
      supplierId,
      supplierName,
      contactPerson: contactPerson || '',
      phone,
      email: email.toLowerCase(),
      address,
    });

    res.status(201).json({
      success: true,
      message: 'Supplier added successfully',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
exports.updateSupplier = async (req, res, next) => {
  try {
    let supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin only)
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    // Safety check: verify no medicines are associated with this supplier
    const medicineCount = await Medicine.countDocuments({
      supplier: supplier._id,
    });

    if (medicineCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier '${supplier.supplierName}' because ${medicineCount} medicine(s) are currently associated with it. Please reassign or remove the medicines first.`,
      });
    }

    await supplier.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
