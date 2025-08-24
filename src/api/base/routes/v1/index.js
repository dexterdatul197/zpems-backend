const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const expenseRoutes = require('./expense.route');
const expenseReportRoutes = require('./expenseReport.route');
const settingsRoutes = require('./settings.route');
const fileRoutes = require('./files.route');
const categoryRoutes = require('./category.route');
const currencyRoutes = require('./currency.route');
const invoiceRoutes = require('./invoice.route');

const clockifyModuleRoutes = require('../../../clockify/routes');
const sapModuleRoutes = require('../../../sap/routes');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/expenses', expenseRoutes);
router.use('/expense-reports', expenseReportRoutes);
router.use('/settings', settingsRoutes);
router.use('/files', fileRoutes);
router.use('/categories', categoryRoutes);
router.use('/currencies', currencyRoutes);
router.use('/invoices', invoiceRoutes);

router.use('/clockify', clockifyModuleRoutes);
router.use('/sap', sapModuleRoutes);

module.exports = router;
