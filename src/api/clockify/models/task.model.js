const { uniq } = require('lodash');
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    projectInternalId: {
      type: String,
      required: true,
    },
    internalId: {
      type: String,
      // required: true,
      // unique: true,
    },
    assigneeIds: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ClockifyTask', taskSchema);
