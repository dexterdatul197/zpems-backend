const httpStatus = require('http-status');
const Category = require('../models/category.model');
const { executeSuiteQLQuery } = require('../services/netsuite');

exports.list = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const category = new Category({ ...req.body });
    const savedCategory = await category.save();

    res.status(httpStatus.CREATED);
    res.json(savedCategory);
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    Object.keys(req.body).forEach((key) => {
      category[key] = req.body[key];
    });
    const savedCategory = await category.save();
    res.json(savedCategory);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    await category.remove();
    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

exports.sync = async (req, res, next) => {
  try {
    const result = await executeSuiteQLQuery('SELECT * FROM expensecategory');
    const items = result.items || [];

    // iterate items and create/update categories
    for (const item of items) {
      const category = await Category.findOne({ internalId: item.id });
      if (category) {
        category['name'] = item['name'];
        category['status'] = item['isinactive'] === 'T' ? 'inactive' : 'active';
        await category.save();
      } else {
        await Category.create({
          name: item['name'],
          internalId: item['id'],
          glCode: item['id'],
          status: item['isinactive'] === 'T' ? 'inactive' : 'active',
        });
      }
    }

    // update all categories that are not in the items list to inactive
    await Category.updateMany(
      { internalId: { $nin: items.map((item) => item.id) } },
      { status: 'inactive' }
    );

    res.json({ message: `Synced ${items.length} categories.` }).end();
  } catch (error) {
    next(error);
  }
};
