const mongoose = require('mongoose');

const lineTimesheetSchema = new mongoose.Schema(
  {
    weekStartDate: {
      type: Date,
      required: true,
    },
    taskInternalId: {
      type: String,
      required: true,
    },
    projectInternalId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ClockifyLineTimesheet', lineTimesheetSchema);
