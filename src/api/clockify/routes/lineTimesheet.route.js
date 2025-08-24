const express = require('express');
const controller = require('../controllers/lineTimesheet.controller');
const { authorize } = require('../../base/middlewares/auth');

const router = express.Router();

router.route('/').get(authorize(), controller.list);

//create
router.route('/').post(authorize(), controller.create);

//update
router.route('/:id').patch(authorize(), controller.update);
router
  .route('/:id/time-entries')
  .post(authorize(), controller.createOrUpdateTimeEntry);

//delete
router.route('/:id').delete(authorize(), controller.remove);

router
  .route('/submit-time-entries')
  .post(authorize(), controller.submitTimeEntries);

module.exports = router;
