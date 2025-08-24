const express = require('express');
const controller = require('../controllers/project.controller');
const { authorize, ADMIN } = require('../../base/middlewares/auth');

const router = express.Router();

router.route('/').get(authorize(), controller.list);
router.route('/sync').post(authorize(ADMIN), controller.sync);

module.exports = router;
