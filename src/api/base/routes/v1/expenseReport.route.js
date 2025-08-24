const multer = require('multer');
const express = require('express');
const controller = require('../../controllers/expenseReport.controller');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();

router.route('/').get(authorize(), controller.list);
router.route('/').post(authorize(), controller.create);

router.route('/:expenseReportId').get(authorize(), controller.get);
router.route('/:expenseReportId').patch(authorize(), controller.update);
router.route('/:expenseReportId').delete(authorize(), controller.remove);

router.route('/:expenseReportId/submit').post(authorize(), controller.submit);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

router
  .route('/import-from-csv')
  .post(authorize(), upload.single('csvfile'), controller.importFromCsv);

module.exports = router;
