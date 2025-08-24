const express = require('express');
const vendorRoutes = require('./vendor.route');

const router = express.Router();

router.use('/vendors', vendorRoutes);

module.exports = router;
