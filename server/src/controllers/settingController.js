const Setting = require('../models/Setting');

// @desc    Get pharmacy system settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({
        pharmacyName: 'Apex MediCare Pharmacy',
        tagline: 'Healthcare & Medicine Inventory Management',
        address: '104 Healthcare Bhavan, Medical Enclave, Bandra West, Mumbai, Maharashtra 400050',
        phone: '+91 98200 12345',
        email: 'support@apexmedicare.in',
        currency: 'INR (₹)',
        currencySymbol: '₹',
        taxRate: 5.0,
        defaultReorderLevel: 20,
        expiryWarningDays: 30,
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pharmacy system settings
// @route   PUT /api/settings
// @access  Private (Admin only)
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      settings = await Setting.findByIdAndUpdate(settings._id, req.body, {
        new: true,
        runValidators: true,
      });
    }

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
