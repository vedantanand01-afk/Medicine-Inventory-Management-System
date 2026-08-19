const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      uppercase: true,
    },
    medicineName: {
      type: String,
      required: [true, 'Please provide medicine name'],
      trim: true,
    },
    genericName: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Please provide medicine category'],
      trim: true,
    },
    dosageForm: {
      type: String,
      default: 'Tablet',
      trim: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Please associate a supplier'],
    },
    batchNumber: {
      type: String,
      required: [true, 'Please provide batch number'],
      trim: true,
      uppercase: true,
    },
    manufacturingDate: {
      type: Date,
      required: [true, 'Please provide manufacturing date'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Please provide expiry date'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Please provide unit selling price'],
      min: [0, 'Unit price cannot be negative'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      default: 20,
      min: [0, 'Reorder level cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: 'Shelf A1',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for Stock reference
medicineSchema.virtual('stock', {
  ref: 'Stock',
  localField: '_id',
  foreignField: 'medicine',
  justOne: true,
});

medicineSchema.set('toObject', { virtuals: true });
medicineSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Medicine', medicineSchema);
