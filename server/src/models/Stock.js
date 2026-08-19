const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    stockId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      default: 20,
      min: [0, 'Reorder level cannot be negative'],
    },
    location: {
      type: String,
      trim: true,
      default: 'Shelf A1',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Stock', stockSchema);
