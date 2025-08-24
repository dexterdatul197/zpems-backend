const httpStatus = require('http-status');
const Expense = require('../models/expense.model');
const Category = require('../models/category.model');

const fs = require('fs');
const { parse } = require('csv-parse/sync');

const {
  parseReceiptImageWithChatGPT,
  getChatgptCompletion,
} = require('../services/openai');

const pdfParse = require('pdf-parse');

const parsePdf = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

exports.list = async (req, res, next) => {
  const {
    pageSize,
    pageIndex,
    sorting = ['-createdAt'],
    dateFrom,
    dateTo,
    merchantName,
    category,
    attendee = 'all',
    status,
  } = req.query;

  try {
    // const expenses = await Expense.find({});
    // can you aggregate to return expense report name

    const skip = pageIndex && pageSize ? pageIndex * pageSize : 0;
    const limit = pageSize ? parseInt(pageSize, 10) : 0;
    const filters = {};
    const sortOptions = {};

    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.$gte = new Date(dateFrom);
      if (dateTo) filters.date.$lte = new Date(dateTo);
    }
    if (merchantName) filters.merchantName = new RegExp(merchantName, 'i');
    if (category) filters.category = category;

    if (sorting) {
      // "title,-publishedAt" is sample value
      // const sortFields = sorting.split(",");
      sorting.forEach((sortField) => {
        const sortOrder = sortField.startsWith('-') ? -1 : 1;
        const fieldName = sortField.replace(/^-/, '');
        sortOptions[fieldName] = sortOrder;
      });
    }

    if (attendee === 'mine') {
      filters['attendee'] = req.user._id;
    } else if (attendee === 'others') {
      filters['attendee'] = { $ne: req.user._id };
    }
    if (req.user.role !== 'admin') {
      filters['attendee'] = req.user._id;
    }

    if (status) {
      if (!status.includes('not_reported')) {
        filters['expenseReport.status'] = { $in: status };
      } else {
        filters['$or'] = [
          { 'expenseReport.status': { $in: status } },
          { expenseReport: null },
        ];
      }
    }

    const patterns = [
      {
        $match: {
          deletedAt: null,
        },
      },
      {
        $lookup: {
          from: 'expensereports',
          localField: 'expenseReportId',
          foreignField: '_id',
          as: 'expenseReport',
        },
      },
      {
        $unwind: {
          path: '$expenseReport',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $match: filters,
      },

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

      {
        $skip: skip,
      },
    ];

    if (limit > 0) {
      patterns.push({ $limit: limit });
    }
    if (Object.keys(sortOptions).length > 0) {
      patterns.push({ $sort: sortOptions });
    }

    const expenses = await Expense.aggregate(patterns);
    const totalCount = await Expense.countDocuments(filters);
    const pageCount = pageSize ? Math.ceil(totalCount / pageSize) : -1;

    res.json({
      data: expenses,
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
    const expense = new Expense({
      ...req.body,
      userId: req.user._id,
    });
    const savedExpense = await expense.save();
    res.status(httpStatus.CREATED);
    res.json(savedExpense);
  } catch (error) {
    next(error);
  }
};

exports.group = async (req, res, next) => {
  const {
    dateFrom,
    dateTo,
    merchantName,
    category,
    attendee = 'all',
    status,
  } = req.query;

  const filters = {};

  if (dateFrom || dateTo) {
    filters.date = {};
    if (dateFrom) filters.date.$gte = new Date(dateFrom);
    if (dateTo) filters.date.$lte = new Date(dateTo);
  }
  if (merchantName) filters.merchantName = new RegExp(merchantName, 'i');
  if (category) filters.category = category;
  if (status) {
    filters['expenseReport.status'] = { $in: status };
  }

  if (attendee === 'mine') {
    filters['attendee'] = req.user._id;
  } else if (attendee === 'others') {
    filters['attendee'] = { $ne: req.user._id };
  }
  if (req.user.role !== 'admin') {
    filters['attendee'] = req.user._id;
  }

  try {
    const expenseGroup = await Expense.aggregate([
      {
        $match: {
          deletedAt: null,
        },
      },
      {
        $lookup: {
          from: 'expensereports',
          localField: 'expenseReportId',
          foreignField: '_id',
          as: 'expenseReport',
        },
      },
      {
        $match: filters,
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$total' },
          count: { $sum: 1 },
          average: { $avg: '$total' },
          expenses: { $push: '$$ROOT' },
        },
      },

      {
        $lookup: {
          from: 'categories', // use the actual name of the categories collection
          localField: '_id',
          foreignField: 'internalId',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
    ]);
    res.json(expenseGroup);
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    Object.keys(req.body).forEach((key) => {
      expense[key] = req.body[key];
    });
    const savedExpense = await expense.save();
    res.json(savedExpense);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await Expense.findByIdAndUpdate(req.params.expenseId, {
      $set: { deletedAt: new Date() },
    });

    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

exports.scanReceipt = async (req, res, next) => {
  try {
    const { receiptFile } = req.body;

    console.log('receiptFile', receiptFile);

    let parsedData;

    const receiptFileType = receiptFile.endsWith('.pdf') ? 'pdf' : 'image';
    const receiptPath = `./public/${receiptFile.split('public/')[1]}`;
    if (receiptFileType === 'pdf') {
      parsedData = await parsePdf(receiptPath);
    } else {
      parsedData = await parseReceiptImageWithChatGPT(receiptPath);
    }

    console.log('result', parsedData);

    const categories = await Category.find({ status: 'active' });

    const userMessage = `
Here are expense categories as array:
    ${JSON.stringify(
      categories.map(({ name, internalId }) => ({ name, id: internalId }))
    )}
------------------------------------------------------------------------------------------------------------------------------------------------

Here is expense info:
    ${parsedData}
------------------------------------------------------------------------------------------------------------------------------------------------

I need to know the expense category of the expense info, merchant name, date and total amount.

please give me response as the following json format:

{
  categoryId: [category id],
  merchantName: [merchant name],
  date: [date],
  total: [total amount in number, no currency symbol],
  currency: [currency],
}
    `;
    const expenseData = await getChatgptCompletion({
      systemMessage: 'You are a helpful assistant.',
      userMessage,
    });

    res.json({ result: parsedData, expenseData });
  } catch (error) {
    next(error);
  }
};

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

    const expenses = await Promise.all(
      records.map(async (record) => {
        const category = await Category.findOne({ name: record.Category });
        return {
          userId: req.user._id,
          merchantName: record.Merchant,
          date: new Date(record.ExpenseDate),
          total: parseFloat(record.Total),
          category: category.internalId,
          attendee: record.Attendee,
          currency: 'USD',
        };
      })
    );

    const savedExpenses = await Expense.insertMany(expenses);
    res.json(savedExpenses);
  } catch (error) {
    next(error);
  }
};
