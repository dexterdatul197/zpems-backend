const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema(
  {
    duration: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },

    lineTimesheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClockifyLineTimesheet',
      required: true,
    },

    internalId: {
      type: String,
    },
    submittedAt: {
      type: Date,
    },

    date: {
      type: Date,
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

module.exports = mongoose.model('ClockifyTimeEntry', timeEntrySchema);
