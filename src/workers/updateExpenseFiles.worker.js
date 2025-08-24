Promise = require('bluebird'); // eslint-disable-line no-global-assign
const mongoose = require('mongoose');

const mongooseConfig = require('../config/mongoose');
const Expense = require('../api/base/models/expense.model');

const main = async () => {
  await mongooseConfig.connect();

  const expenses = await Expense.find({});

  for (const expense of expenses) {
    const newReceiptFile = expense.receiptFile.replace(
      'http://3.22.110.59',
      'https://financeerpai.com'
    );

    await Expense.findByIdAndUpdate(
      expense._id,
      {
        $set: {
          receiptFile: newReceiptFile,
        },
      },
      { timestamps: false }
    );
  }

  await mongooseConfig.disconnect();
};

main();
