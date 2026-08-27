const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    pharmacyName: {
      type: String,
      default: 'Apex MediCare Pharmacy',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Healthcare & Medicine Inventory Management',
      trim: true,
    },
    address: {
      type: String,
      default: '104 Healthcare Bhavan, Medical Enclave, Bandra West, Mumbai, Maharashtra 400050',
      trim: true,
    },
    phone: {
      type: String,
      default: '+91 98200 12345',
      trim: true,
    },
    email: {
      type: String,
      default: 'support@apexmedicare.in',
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR (₹)',
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: '₹',
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    defaultReorderLevel: {
      type: Number,
      default: 20,
      min: 1,
    },
    expiryWarningDays: {
      type: Number,
      default: 30,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
