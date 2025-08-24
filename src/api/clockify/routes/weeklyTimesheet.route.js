const express = require('express');
const controller = require('../controllers/lineTimesheet.controller');
const { authorize } = require('../../base/middlewares/auth');

const router = express.Router();

router.route('/').get(authorize(), controller.getWeeklyTimesheets);

module.exports = router;
