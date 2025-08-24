const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    internalId: {
      type: String,
      // required: true,
      // unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ClockifyClient', clientSchema);
