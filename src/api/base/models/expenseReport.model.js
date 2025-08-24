const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const Expense = require('./expense.model');

const expenseReportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'submitted', 'approved', 'rejected'],
      default: 'open',
    },
    submittedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    internalId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

expenseReportSchema.plugin(AutoIncrement, { inc_field: 'tranId' });

expenseReportSchema.methods.getExpenses = function () {
  return Expense.find({ expenseReportId: this._id });
};

expenseReportSchema.pre(/^find/, function (next) {
  this.find({ deletedAt: null });
  next();
});

module.exports = mongoose.model('ExpenseReport', expenseReportSchema);
