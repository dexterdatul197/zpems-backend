const moment = require('moment-timezone');
const uuid = require('uuid/v4');
const httpStatus = require('http-status');
const ExpenseReport = require('../models/expenseReport.model');
const Expense = require('../models/expense.model');
const Category = require('../models/category.model');
const Currency = require('../models/currency.model');
const User = require('../models/user.model');

const {
  createExpenseReport,
  updateExpenseReport,
  executeSuiteQLQuery,
} = require('../services/netsuite');

exports.list = async (req, res, next) => {
  const {
    pageIndex = 0,
    pageSize = 9999,
    sorting = ['-createdAt'],
    dateFrom,
    dateTo,
    name,
    tranId,
    attendee = 'all',
    status,
  } = req.query;
  try {
    const skip = pageIndex && pageSize ? pageIndex * pageSize : 0;
    const limit = pageSize ? parseInt(pageSize, 10) : 0;
    const filters = {};
    const sortOptions = {};

    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.$gte = new Date(dateFrom);
      if (dateTo) filters.date.$lte = new Date(dateTo);
    }
    if (name) filters.name = new RegExp(name, 'i');
    if (tranId) filters.tranIdStr = new RegExp(tranId + '');
    if (attendee === 'mine') {
      filters['attendee'] = req.user._id;
    } else if (attendee === 'others') {
      filters['attendee'] = { $ne: req.user._id };
    }
    if (req.user.role !== 'admin') {
      filters['attendee'] = req.user._id;
    }

    if (sorting) {
      // "title,-publishedAt" is sample value
      // const sortFields = sorting.split(",");
      sorting.forEach((sortField) => {
        const sortOrder = sortField.startsWith('-') ? -1 : 1;
        const fieldName = sortField.replace(/^-/, '');
        sortOptions[fieldName] = sortOrder;
      });
    }

    if (status) {
      filters.status = { $in: status };
    }

    const expenseReports = await ExpenseReport.aggregate([
      {
        $match: {
          deletedAt: null,
        },
      },
      {
        $addFields: {
          tranIdStr: {
            $toString: '$tranId',
          },
        },
      },
      {
        $match: filters,
      },
      {
        $lookup: {
          from: 'expenses', // use the actual name of the expenses collection
          localField: '_id',
          foreignField: 'expenseReportId',
          as: 'expenses',
          pipeline: [
            {
              $lookup: {
                from: 'categories', // use the actual name of the categories collection
                localField: 'category',
                foreignField: 'internalId',
                as: 'category',
              },
            },
            {
              $unwind: '$category',
            },
          ],
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $sort: sortOptions,
      },
    ]);

    const totalCount = await ExpenseReport.countDocuments(filters);
    const pageCount = pageSize ? Math.ceil(totalCount / pageSize) : -1;

    res.json({
      data: expenseReports,
      pagination: {
        totalCount,
        pageCount,
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const expenseReport = new ExpenseReport({ ...req.body });
    const savedExpenseReport = await expenseReport.save();

    res.status(httpStatus.CREATED);
    res.json(savedExpenseReport);
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const expenseReport = await ExpenseReport.findById(
      req.params.expenseReportId
    );
    res.json(expenseReport);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const expenseReport = await ExpenseReport.findById(
      req.params.expenseReportId
    );
    Object.keys(req.body).forEach((key) => {
      expenseReport[key] = req.body[key];
    });
    const savedExpenseReport = await expenseReport.save();
    res.json(savedExpenseReport);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await ExpenseReport.findByIdAndUpdate(req.params.expenseReportId, {
      $set: { deletedAt: new Date() },
    });

    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

exports.submit = async (req, res, next) => {
  try {
    const expenseReport = await ExpenseReport.findById(
      req.params.expenseReportId
    );

    const expenses = await expenseReport.getExpenses();
    const currencies = await Currency.find();

    const items = [];
    for (const expense of expenses) {
      const foundCurrency = currencies.find(
        (x) => x.symbol === expense.currency
      );
      items.push({
        category: {
          id: parseInt(expense.category),
        },
        amount: expense.total,
        currency: foundCurrency.internalId,
        memo: expense.description,
        expensedate: moment(expense.date).format('YYYY-MM-DD'),
      });
    }

    const user = await User.findById(expenseReport.attendee);

    const body = {
      supervisorapproval: true,
      accountingapproval: true,
      externalid: expenseReport.tranId,
      entity: {
        id: user.internalId,
      },
      expense: { items },
      memo: expenseReport.name,
    };

    //15619

    try {
      if (!expenseReport.internalId) {
        const data = await createExpenseReport(body);
        console.log('AAA --- submitted to netsuite', data);

        const result = await executeSuiteQLQuery(
          `SELECT id from transaction where recordtype ='expensereport' AND externalid=${expenseReport.tranId}`
        );

        expenseReport.submittedAt = new Date();
        expenseReport.status = 'submitted';
        expenseReport.internalId = result.items[0].id;
        await expenseReport.save();
        res.json({ ok: true, body, response: data, error: null });
      } else {
        // const data = await updateExpenseReport(15619, body);
        const data = await updateExpenseReport(expenseReport.internalId, body);
        console.log('AAA --- submitted to netsuite', data);

        expenseReport.submittedAt = new Date();
        await expenseReport.save();
        res.json({ ok: true, body, response: data, error: null });
      }
    } catch (error) {
      console.log(error);

      res.status(httpStatus.BAD_REQUEST).json({
        ok: false,
        body,
        error: error.response.data,
      });
    }
  } catch (error) {
    next(error);
  }
};

const fs = require('fs');
const { parse } = require('csv-parse/sync');

exports.importFromCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const csvData = fs.readFileSync(req.file.path, 'utf8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    const expenseReports = [];

    for (const record of records) {
      let found = expenseReports.find((x) => x.id === record.ExpenseReportID);
      if (found) {
        if (record.Merchant && record.ExpenseDate && record.Total) {
          const category = await Category.findOne({ name: record.Category });

          found.expenses.push({
            userId: req.user._id,
            merchantName: record.Merchant,
            date: new Date(record.ExpenseDate),
            total: parseFloat(record.Total),
            category: category.internalId,
            attendee: record.Attendee,
            currency: 'USD',
          });
        }
      } else {
        const expenseReport = {
          id: record.ExpenseReportID,
          name: record.ReportName,
          date: new Date(record.ExpenseReportDate),
          status: record.Status,
          submittedAt: record.SubmittedAt,

          expenses: [],
        };

        if (record.Merchant && record.ExpenseDate && record.Total) {
          const category = await Category.findOne({ name: record.Category });

          expenseReport.expenses.push({
            userId: req.user._id,
            merchantName: record.Merchant,
            date: new Date(record.ExpenseDate),
            total: parseFloat(record.Total),
            category: category.internalId,
            attendee: record.Attendee,
            currency: 'USD',
          });
        }

        expenseReports.push(expenseReport);
      }
    }

    for (const expenseReport of expenseReports) {
      const expenses = expenseReport.expenses;
      delete expenseReport.id;
      delete expenseReport.expenses;

      const savedExpenseReport = await new ExpenseReport(expenseReport).save();
      console.log('saved expense report', savedExpenseReport);

      const savedExpenses = await Expense.insertMany(
        expenses.map((x) => ({ ...x, expenseReportId: savedExpenseReport._id }))
      );
    }

    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};
