const httpStatus = require('http-status');
const Client = require('../models/client.model');

exports.list = async (req, res, next) => {
  const { sorting } = req.query;

  // sorting
  const sortOptions = {};
  if (sorting) {
    const sortFields = sorting.split(',');
    sortFields.forEach((sortField) => {
      const sortOrder = sortField.startsWith('-') ? -1 : 1;
      const fieldName = sortField.replace(/^-/, '');
      sortOptions[fieldName] = sortOrder;
    });
  }

  try {
    const clients = await Client.aggregate([
      {
        $sort: sortOptions,
      }]);

    res.json(clients);
  } catch (error) {
    next(error);
  }
};

exports.projectlist = async (req, res, next) => {
  try {
    const clients = await Client.aggregate([
      {
        $lookup: {
          from: 'clockifyprojects',
          localField: 'internalId',
          foreignField: 'clientInternalId',
          as: 'projects',
        },
      }]);

    res.json(clients);
  } catch (error) {
    next(error);
  }
};
