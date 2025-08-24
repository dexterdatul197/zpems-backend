Promise = require('bluebird'); // eslint-disable-line no-global-assign
const mongoose = require('mongoose');

const mongooseConfig = require('../config/mongoose');
const Category = require('../api/base/models/category.model');

// const expenseCategories = [
//   {
//     id: 2,
//     name: '401K Employee Contribution',
//   },
//   {
//     id: 5,
//     name: 'Advertising Fee',
//   },
//   {
//     id: 6,
//     name: 'Airfare',
//   },
//   {
//     id: 7,
//     name: 'Alarm Monitoring Fee',
//   },
//   {
//     id: 11,
//     name: 'Auto Repair/Maintenance',
//   },
//   {
//     id: 13,
//     name: 'Bar Code Registration Fee',
//   },
//   {
//     id: 16,
//     name: 'Car Rental',
//   },
//   {
//     id: 19,
//     name: 'Company Truck Gas',
//   },
//   {
//     id: 27,
//     name: 'Document Fee',
//   },
//   {
//     id: 30,
//     name: 'Dues & Subscriptions',
//   },
//   {
//     id: 33,
//     name: 'Employee training fee',
//   },
//   {
//     id: 35,
//     name: 'Entertainment',
//   },
//   {
//     id: 36,
//     name: 'Equipment Rental',
//   },
//   {
//     id: 38,
//     name: 'Gas/Mileage Reimburse',
//   },
//   {
//     id: 41,
//     name: 'Hotel',
//   },
//   {
//     id: 49,
//     name: 'Marketing Design Costs',
//   },
//   {
//     id: 50,
//     name: 'Marketing Other Expenses',
//   },
//   {
//     id: 51,
//     name: 'Meals (office)',
//   },
//   {
//     id: 53,
//     name: 'Meals Expenses',
//   },
//   {
//     id: 59,
//     name: 'Newpaper Ads',
//   },
//   {
//     id: 60,
//     name: 'Office Sample',
//   },
//   {
//     id: 64,
//     name: 'Other Ad Placements',
//   },
//   {
//     id: 66,
//     name: 'Parking',
//   },
//   {
//     id: 70,
//     name: 'Postage',
//   },
//   {
//     id: 72,
//     name: 'Posters / Banners',
//   },
//   {
//     id: 74,
//     name: 'Promotional Flyer',
//   },
//   {
//     id: 75,
//     name: 'Promotions - Others',
//   },
//   {
//     id: 76,
//     name: 'Promotions-Complimentary Coupon',
//   },
//   {
//     id: 78,
//     name: 'Rebates ( Mrkting)',
//   },
//   {
//     id: 79,
//     name: 'Referral Fee',
//   },
//   {
//     id: 83,
//     name: 'Rent -Storage',
//   },
//   {
//     id: 85,
//     name: 'Royalty Fee',
//   },
//   {
//     id: 90,
//     name: 'Samples',
//   },
//   {
//     id: 91,
//     name: 'Samples ( internal )',
//   },
//   {
//     id: 98,
//     name: 'Television Ads',
//   },
//   {
//     id: 102,
//     name: 'Transportation/Taxi',
//   },
//   {
//     id: 104,
//     name: 'Uniform',
//   },
//   {
//     id: 106,
//     name: 'Vehicle Leases',
//   },
//   {
//     id: 107,
//     name: 'Vehicle Registration',
//   },
//   {
//     id: 109,
//     name: 'Visa/Others',
//   },
//   {
//     id: 201,
//     name: 'Mileage Reimbursement',
//   },
//   {
//     id: 202,
//     name: 'Tolls',
//   },
//   {
//     id: 203,
//     name: 'Transfer',
//   },
//   {
//     id: 204,
//     name: 'Purchasing Related Shipping',
//   },
//   {
//     id: 205,
//     name: 'Machinery Rental',
//   },
//   {
//     id: 206,
//     name: 'Container Related Shipping',
//   },
//   {
//     id: 207,
//     name: 'Demurrage for customer',
//   },
// ];

const expenseCategories = [
  {
    category_id: 2,
    category_name: 'Car and Maintenance',
    description: 'Operating Expenses: Automotive Expense',
  },
  {
    category_id: 8,
    category_name: 'Insurance',
    description:
      "Premiums paid for business insurance policies, including liability insurance, property insurance, and workers' compensation insurance.",
  },
  {
    category_id: 6,
    category_name: 'Marketing and Advertising',
    description:
      'Expenditures for marketing and advertising activities, including online advertising, print media, social media marketing, and promotional materials.',
  },
  {
    category_id: 1,
    category_name: 'Meal Allowances',
    description: 'Employee Meals and Entertainment for Representation',
  },
  {
    category_id: 3,
    category_name: 'Office Supplies',
    description: 'Operating Expenses: Office Expense',
  },
  {
    category_id: 5,
    category_name: 'Rent',
    description:
      'Payments for leasing office space, retail space, or other business premises.',
  },
  {
    category_id: 7,
    category_name: 'Software and Technology',
    description:
      'Expenses related to purchasing software licenses, subscriptions, and technology equipment such as computers, servers, and software applications.',
  },
  {
    category_id: 4,
    category_name: 'Utilities',
    description: 'Operating Expenses: Utilities',
  },
];

const main = async () => {
  await mongooseConfig.connect();

  await Category.deleteMany({});

  for (const category of expenseCategories) {
    const newCategory = new Category({
      name: category.category_name,
      internalId: category.category_id,
      glCode: category.category_id,
      status: 'active',
    });
    await newCategory.save();
  }

  await mongooseConfig.disconnect();
};

main();
