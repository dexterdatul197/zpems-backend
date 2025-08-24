const express = require('express');
const { authorize } = require('../../middlewares/auth');
const moment = require('moment-timezone');

const router = express.Router();

const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

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
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create an S3 instance
const s3 = new AWS.S3();

const uploadFile = async (req, res) => {
  // req.file contains information about the uploaded file
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const fileUrl = `${process.env.API_URL}/${req.file.path}`;

  // Send response
  res.send({
    message: 'File uploaded successfully.',
    fileUrl,
  });
};

router.route('/upload').post(authorize(), upload.single('file'), uploadFile);

module.exports = router;
