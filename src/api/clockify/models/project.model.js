const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    clientInternalId: {
      type: String,
      // required: true,
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

module.exports = mongoose.model('ClockifyProject', projectSchema);
