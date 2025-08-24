const express = require('express');

const controller = require('../controllers/vendor.controller');
const { authorize } = require('../../base/middlewares/auth');

const router = express.Router();

router.route('/').get(authorize(), controller.list);
router.route('/').post(authorize(), controller.create);

router.route('/invite').post(authorize(), controller.invite);

router.route('/:id').get(authorize(), controller.get);
router.route('/:id').put(authorize(), controller.update);
router.route('/:id').patch(authorize(), controller.updatePaymentDetails);
router.route('/:id').delete(authorize(), controller.remove);
router.route('/user/:userId').get(authorize(), controller.getByUserId);

module.exports = router;
