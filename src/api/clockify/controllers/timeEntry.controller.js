const httpStatus = require('http-status');
const moment = require('moment-timezone');

const TimeEntry = require('../models/timeEntry.model');
const LineTimesheet = require('../models/lineTimesheet.model');
const Project = require('../models/project.model');

const {
  getTimeEntryJson,
  transcribeAudioToText,
} = require('../../base/services/openai');

exports.list = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, projectId, taskId, sorting } = req.query;

    //filtering
    const queryOptions = {};
    if (dateFrom || dateTo) {
      queryOptions.date = {};
      if (dateFrom) queryOptions.date.$gte = new Date(dateFrom);
      if (dateTo) queryOptions.date.$lte = new Date(dateTo);
    }
    queryOptions.userId = req.user._id;

    const afterQueryOptions = {};
    if (projectId) {
      afterQueryOptions['lineTimesheet.projectInternalId'] = projectId;
    }
    if (taskId) {
      afterQueryOptions['lineTimesheet.taskInternalId'] = taskId;
    }

    // sorting
    const sortOptions = {};
    if (sorting) {
      const sortFields = sorting.split(',');
      sortFields.forEach((sortField) => {
        const sortOrder = sortField.startsWith('-') ? -1 : 1;
        const fieldName = sortField.replace(/^-/, '');
        sortOptions[fieldName] = sortOrder;
      });
    }

    // const timeEntries = await TimeEntry.find(queryOptions);
    const timeEntries = await TimeEntry.aggregate([
      {
        $match: queryOptions,
      },
      {
        $lookup: {
          from: 'clockifylinetimesheets',
          localField: 'lineTimesheetId',
          foreignField: '_id',
          as: 'lineTimesheet',
        },
      },
      {
        $unwind: '$lineTimesheet',
      },
      {
        $match: afterQueryOptions,
      },
      {
        $lookup: {
          from: 'clockifyprojects',
          localField: 'lineTimesheet.projectInternalId',
          foreignField: 'internalId',
          as: 'project',
        },
      },
      {
        $lookup: {
          from: 'clockifytasks',
          localField: 'lineTimesheet.taskInternalId',
          foreignField: 'internalId',
          as: 'task',
        },
      },
      {
        $unwind: '$project',
      },
      {
        $unwind: '$task',
      },
      {
        $sort: sortOptions,
      },
    ]);

    res.json(timeEntries);
  } catch (error) {
    next(error);
  }
};

exports.getTimeReports = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const queryOptions = {};
    if (dateFrom || dateTo) {
      queryOptions.date = {};
      if (dateFrom) queryOptions.date.$gte = new Date(dateFrom);
      if (dateTo) queryOptions.date.$lte = new Date(dateTo);
    }

    const timeReports = await TimeEntry.aggregate([
      {
        $match: queryOptions,
      },
      {
        $group: {
          _id: '$date',
          totalDuration: { $sum: '$duration' },
        },
      },
      //sort
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json(timeReports);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { duration, description, date, projectInternalId, taskInternalId } =
      req.body;

    const weekStartDate = new Date(
      moment(date).startOf('isoWeek').format('YYYY-MM-DD')
    );

    const lineTimesheet = await LineTimesheet.findOne({
      weekStartDate,
      taskInternalId,
      projectInternalId,
      userId: req.user._id,
    });

    let shouldCreateNewLineTimesheet = false;

    // TODO: find a better way to check if a time entry already exists
    if (lineTimesheet) {
      const existingTimeEntry = await TimeEntry.findOne({
        lineTimesheetId: lineTimesheet._id,
        date,
        userId: req.user._id,
      });
      if (existingTimeEntry) {
        shouldCreateNewLineTimesheet = true;
      }
    } else {
      shouldCreateNewLineTimesheet = true;
    }

    let lineTimesheetId;
    if (shouldCreateNewLineTimesheet) {
      const newLineTimesheet = new LineTimesheet({
        weekStartDate,
        taskInternalId,
        projectInternalId,
        userId: req.user._id,
      });
      await newLineTimesheet.save();

      lineTimesheetId = newLineTimesheet._id;
    } else {
      lineTimesheetId = lineTimesheet._id;
    }

    const timeEntry = new TimeEntry({
      duration,
      description,
      date,
      lineTimesheetId,
      userId: req.user._id,
    });

    await timeEntry.save();

    res.status(httpStatus.CREATED).json(timeEntry);
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;

    const timeEntry = await TimeEntry.findById(id);

    res.json(timeEntry);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { duration, description, date, projectInternalId, taskInternalId } =
      req.body;

    const timeEntry = await TimeEntry.findById(id);
    if (!timeEntry) {
      return res.status(httpStatus.NOT_FOUND).end();
    }

    const weekStartDate = new Date(
      moment(date).startOf('isoWeek').format('YYYY-MM-DD')
    );

    const lineTimesheet = await LineTimesheet.findById(
      timeEntry.lineTimesheetId
    );

    if (!lineTimesheet) {
      return res.status(httpStatus.NOT_FOUND).end();
    }

    if (
      lineTimesheet.weekStartDate.getTime() === weekStartDate.getTime() &&
      lineTimesheet.taskInternalId === taskInternalId &&
      lineTimesheet.projectInternalId === projectInternalId
    ) {
      timeEntry.duration = duration;
      timeEntry.description = description;
      timeEntry.date = date;
      timeEntry.save();
    } else {
      const newLineTimesheet = new LineTimesheet({
        weekStartDate,
        taskInternalId,
        projectInternalId,
        userId: timeEntry.userId,
      });
      await newLineTimesheet.save();

      timeEntry.lineTimesheetId = newLineTimesheet._id;
      timeEntry.duration = duration;
      timeEntry.description = description;
      timeEntry.date = date;
      timeEntry.save();
    }

    res.json(timeEntry);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await TimeEntry.findByIdAndDelete(id);

    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

exports.getTimeEntryJsonFromAudio = async (req, res, next) => {
  try {
    const projects = await Project.aggregate([
      {
        $lookup: {
          from: 'clockifytasks',
          let: { projectInternalId: '$internalId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$projectInternalId', '$$projectInternalId'] },
                    { $in: [req.user.internalId, '$assigneeIds'] },
                  ],
                },
              },
            },
          ],
          as: 'tasks',
        },
      },
    ]);

    const formattedProjects = projects.map((p) => {
      return {
        name: p.name,
        id: p.internalId,
        tasks: p.tasks.map((t) => ({ name: t.name, id: t.internalId })),
      };
    });

    console.log(JSON.stringify(formattedProjects));

    const file = req.file;
    if (!file) {
      return res.status(400).send({ error: 'No audio uploaded' });
    }

    const transcription = await transcribeAudioToText(`./${file.path}`);

    const timeEntryJson = await getTimeEntryJson(
      transcription,
      formattedProjects
    );
    // console.log(timeEntryJson);
    res.json({ timeEntryJson: JSON.parse(timeEntryJson), transcription });
  } catch (error) {
    next(error);
  }
};
