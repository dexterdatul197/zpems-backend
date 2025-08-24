const express = require('express');
const controller = require('../../controllers/invoice.controller');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();

router.post('/parse-pdf', controller.parseInvoice);

module.exports = router;
