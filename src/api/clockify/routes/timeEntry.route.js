const express = require('express');
const multer = require('multer');
const uuid = require('uuid');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

const controller = require('../controllers/timeEntry.controller');
const { authorize } = require('../../base/middlewares/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = `public/uploads/${moment().format('YYYY')}/${moment().format(
      'MM'
    )}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(path.resolve(dir), { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, uuid.v4() + '.ogg'); // Use UUID for filename
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.route('/').get(authorize(), controller.list);
router.route('/').post(authorize(), controller.create);

router.route('/time-reports').get(authorize(), controller.getTimeReports);

router.route('/:id').get(authorize(), controller.get);
router.route('/:id').put(authorize(), controller.update);
router.route('/:id').patch(authorize(), controller.update);
router.route('/:id').delete(authorize(), controller.remove);

router
  .route('/parse-audio')
  .post(
    authorize(),
    upload.single('audio'),
    controller.getTimeEntryJsonFromAudio
  );

module.exports = router;
