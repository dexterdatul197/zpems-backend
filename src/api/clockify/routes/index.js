const express = require('express');
const clientRoutes = require('./client.route');
const projectRoutes = require('./project.route');
const taskRoutes = require('./task.route');
const timeEntryRoutes = require('./timeEntry.route');
const lineTimesheetRoutes = require('./lineTimesheet.route');
const weeklyTimesheetRoutes = require('./weeklyTimesheet.route');

const router = express.Router();

router.use('/clients', clientRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/time-entries', timeEntryRoutes);
router.use('/line-timesheets', lineTimesheetRoutes);
router.use('/weekly-timesheets', weeklyTimesheetRoutes);

module.exports = router;
