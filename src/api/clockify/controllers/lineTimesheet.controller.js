const httpStatus = require('http-status');
const LineTimesheet = require('../models/lineTimesheet.model');
const TimeEntry = require('../models/timeEntry.model');

const {
  createTimeEntry,
  updateTimeEntry,
  executeSuiteQLQuery,
} = require('../../base/services/netsuite');

exports.list = async (req, res, next) => {
  try {
    const { weekStartDate } = req.query;

    const timesheets = await LineTimesheet.aggregate([
      {
        $match: {
          weekStartDate: new Date(weekStartDate),
          userId: req.user._id,
        },
      },
      {
        $lookup: {
          from: 'clockifytimeentries',
          localField: '_id',
          foreignField: 'lineTimesheetId',
          as: 'timeEntries',
        },
      },
    ]);

    res.json(timesheets);
  } catch (error) {
    next(error);
  }
};

exports.getWeeklyTimesheets = async (req, res, next) => {
  const { dateFrom, dateTo, sorting = '_id' } = req.query;
  const queryOptions = {};
  if (dateFrom || dateTo) {
    queryOptions.date = {};
    if (dateFrom) queryOptions.date.$gte = new Date(dateFrom);
    if (dateTo) queryOptions.date.$lte = new Date(dateTo);
  }

  const sortOptions = {};

  if (sorting) {
    const sortFields = sorting.split(',');
    sortFields.forEach((sortField) => {
      const sortOrder = sortField.startsWith('-') ? -1 : 1;
      const fieldName = sortField.replace(/^-/, '');
      sortOptions[fieldName] = sortOrder;
    });
  }

  try {
    const timesheets = await LineTimesheet.aggregate([
      {
        $match: {
          userId: req.user._id,
          ...queryOptions,
        },
      },
      {
        $lookup: {
          from: 'clockifytimeentries', // Ensure this is the correct collection name
          localField: '_id',
          foreignField: 'lineTimesheetId',
          as: 'timeEntries',
        },
      },
      {
        $unwind: '$timeEntries', // Deconstruct the array to sum durations
      },
      {
        $group: {
          _id: '$weekStartDate', // Group by week start date
          totalDuration: { $sum: '$timeEntries.duration' }, // Sum the duration of time entries
          lineTimesheets: { $push: '$$ROOT' }, // Collect all lineTimesheets under the week start date
        },
      },
      {
        $sort: sortOptions, // Sort by week start date
      },
    ]);
    res.json(timesheets);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const timesheet = new LineTimesheet({
      ...req.body,
      userId: req.user._id,
    });
    await timesheet.save();
    res.status(httpStatus.CREATED);
    res.json(timesheet);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lineTimesheet = await LineTimesheet.findById(id);
    Object.keys(req.body).forEach((key) => {
      lineTimesheet[key] = req.body[key];
    });
    const savedLineTimesheet = await lineTimesheet.save();

    // const timesheet = await LineTimesheet.findByIdAndUpdate(id, req.body, {
    //   new: true,
    // });

    res.json(savedLineTimesheet);
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateTimeEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lineTimesheet = await LineTimesheet.findById(id);

    if (!lineTimesheet) {
      throw new Error('Line timesheet not found');
    }

    const { date } = req.body;

    if (!date) {
      throw new Error('Date is required');
    }

    const timeEntry = await TimeEntry.findOne({
      lineTimesheetId: id,
      date,
      userId: req.user._id,
    });

    if (timeEntry) {
      Object.keys(req.body).forEach((key) => {
        timeEntry[key] = req.body[key];
      });
      await timeEntry.save();
      res.json(timeEntry);
    } else {
      const savedTimeEntry = await TimeEntry.create({
        lineTimesheetId: id,
        date,
        userId: req.user._id,
        ...req.body,
      });
      res.json(savedTimeEntry);
    }
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await TimeEntry.deleteMany({ lineTimesheetId: id });
    await LineTimesheet.findByIdAndDelete(id);
    res.status(httpStatus.NO_CONTENT);
    res.end();
  } catch (error) {
    next(error);
  }
};

function formatHours(hours) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}:${minutes < 10 ? '0' : ''}${minutes}`;
}

const submitTimeEntry = async (timeEntry, lineTimesheet, userInternalId) => {
  const body = {
    externalid: timeEntry._id,
    employee: userInternalId,
    customer: lineTimesheet.project.internalId,
    caseTaskEvent: lineTimesheet.task.internalId,
    // item: "176",
    trandate: timeEntry.date,
    hours: formatHours(timeEntry.duration),
    subsidiary: 1,
    location: 1,
    memo: timeEntry.description,
  };

  if (!timeEntry.internalId) {
    const data = await createTimeEntry(body);
    console.log('submitted to netsuite - created', data);

    const result = await executeSuiteQLQuery(
      `SELECT id, displayfield FROM timebill where externalid='${timeEntry._id}'`
    );

    await TimeEntry.findOneAndUpdate(
      { _id: timeEntry._id },
      {
        submittedAt: new Date(),
        internalId: result.items[0].id,
      },
      { new: true } // this option returns the updated document
    );
  } else {
    const data = await updateTimeEntry(timeEntry.internalId, body);
    console.log('submitted to netsuite - updated', data);

    await TimeEntry.findOneAndUpdate(
      { _id: timeEntry._id },
      {
        submittedAt: new Date(),
      },
      { new: true } // this option returns the updated document
    );
  }
};

exports.submitTimeEntries = async (req, res, next) => {
  try {
    const { weekStartDate } = req.query;

    const timesheets = await LineTimesheet.aggregate([
      {
        $match: {
          weekStartDate: new Date(weekStartDate),
          userId: req.user._id,
        },
      },
      {
        $lookup: {
          from: 'clockifytimeentries',
          localField: '_id',
          foreignField: 'lineTimesheetId',
          as: 'timeEntries',
        },
      },
      {
        $lookup: {
          from: 'clockifytasks',
          localField: 'taskInternalId',
          foreignField: 'internalId',
          as: 'task',
        },
      },
      {
        $lookup: {
          from: 'clockifyprojects',
          localField: 'projectInternalId',
          foreignField: 'internalId',
          as: 'project',
        },
      },
      {
        $unwind: '$task',
      },
      {
        $unwind: '$project',
      },
      {
        $lookup: {
          from: 'clockifyclients',
          localField: 'project.clientInternalId',
          foreignField: 'internalId',
          as: 'client',
        },
      },
      {
        $unwind: '$client',
      },
    ]);

    for (const timesheet of timesheets) {
      for (const timeEntry of timesheet.timeEntries) {
        try {
          await submitTimeEntry(timeEntry, timesheet, req.user.internalId);
          break;
        } catch (error) {
          console.log(error.response?.data);
          res.status(httpStatus.BAD_REQUEST).json({
            ok: false,
            body,
            error: error.response?.data,
          });
        }
      }
    }

    res.json(timesheets);
  } catch (error) {
    next(error);
  }
};
