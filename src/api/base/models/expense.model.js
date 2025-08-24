const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    receiptFile: {
      type: String,
    },
    merchantName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },

    // TODO: rename to categoryInternalId?
    category: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },
    expenseReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseReport',
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // TODO: reserved for future use, remove if not used
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.pre(/^find/, function (next) {
  this.find({ deletedAt: null });
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
