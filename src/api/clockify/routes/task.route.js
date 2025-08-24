const express = require('express');
const controller = require('../controllers/task.controller');
const { authorize, ADMIN } = require('../../base/middlewares/auth');

const router = express.Router();

router.route('/').get(authorize(), controller.list);
router.route('/:id').patch(authorize(), controller.update);
router.route('/sync').post(authorize(ADMIN), controller.sync);

module.exports = router;
