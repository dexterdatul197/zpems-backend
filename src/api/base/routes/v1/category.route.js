const express = require('express');
const controller = require('../../controllers/category.controller');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();

router.route('/').get(authorize(), controller.list);
router.route('/').post(authorize(), controller.create);
router.route('/sync').post(authorize(), controller.sync);

router.route('/:categoryId').get(authorize(), controller.get);
router.route('/:categoryId').patch(authorize(), controller.update);
router.route('/:categoryId').delete(authorize(), controller.remove);

module.exports = router;
