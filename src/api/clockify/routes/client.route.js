const express = require('express');
const controller = require('../controllers/client.controller');
const { authorize } = require('../../base/middlewares/auth');

const router = express.Router();

router.route('/').get(authorize(), controller.list);
router.route('/projects').get(authorize(), controller.projectlist);

module.exports = router;
