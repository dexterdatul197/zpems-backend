const mongoose = require('mongoose');

const expenseReportSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
      default: null,
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
    },
    timeFormat: {
      type: String,
      default: 'HH:mm:ss',
    },
    netsuiteConnectionInfo: {
      type: Object,
      default: null,
    },
    openAIAPIKey: {
      type: String,
      default: null,
    },
    expenseSettings: {
      type: Object,
      default: null,
    },
    expenseReportSettings: {
      type: Object,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', expenseReportSchema);
