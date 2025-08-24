const express = require('express');
const controller = require('../../controllers/settings.controller');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();

router.route('/').get(authorize(), controller.get);
router.route('/').patch(authorize(), controller.update);

router
  .route('/test-netsuite-connection')
  .post(authorize(), controller.testNetsuiteConnection);

// TODO: deprecated
// router
//   .route('/test-openai-connection')
//   .post(authorize(), controller.testOpenAIConnection);

module.exports = router;
