const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    internalId: {
      type: String,
      required: true,
      unique: true,
    },
    symbol: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Currency', currencySchema);
