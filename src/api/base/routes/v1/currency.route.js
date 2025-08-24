const express = require('express');
const controller = require('../../controllers/currency.controller');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();

router.route('/').get(authorize(), controller.list);
router.route('/').post(authorize(), controller.create);
router.route('/sync').post(authorize(), controller.sync);

router.route('/:id').get(authorize(), controller.get);
router.route('/:id').patch(authorize(), controller.update);
router.route('/:id').delete(authorize(), controller.remove);

module.exports = router;
