const httpStatus = require('http-status');
const Currency = require('../models/currency.model');
const { executeSuiteQLQuery } = require('../services/netsuite');

exports.list = async (req, res, next) => {
  try {
    const currencies = await Currency.find({});
    res.json(currencies);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const currency = new Currency({ ...req.body });
    const savedCurrency = await currency.save();

    res.status(httpStatus.CREATED);
    res.json(savedCurrency);
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const currency = await Currency.findById(req.params.id);
    res.json(currency);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const currency = await Currency.findById(req.params.id);
    Object.keys(req.body).forEach((key) => {
      currency[key] = req.body[key];
    });
    const savedCurrency = await currency.save();
    res.json(savedCurrency);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const currency = await Currency.findById(req.params.id);
    await currency.remove();
    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

exports.sync = async (req, res, next) => {
  try {
    const result = await executeSuiteQLQuery('SELECT * FROM currency');
    const items = result.items || [];

    // iterate items and create/update currencies
    for (const item of items) {
      const currency = await Currency.findOne({ internalId: item.id });
      if (currency) {
        currency['name'] = item['name'];
        currency['symbol'] = item['symbol'];
        currency['status'] = item['isinactive'] === 'T' ? 'inactive' : 'active';
        await currency.save();
      } else {
        await Currency.create({
          name: item['name'],
          internalId: item['id'],
          symbol: item['symbol'],
          status: item['isinactive'] === 'T' ? 'inactive' : 'active',
        });
      }
    }

    // update all currencies that are not in the items list to inactive
    await Currency.updateMany(
      { internalId: { $nin: items.map((item) => item.id) } },
      { status: 'inactive' }
    );

    res.json({ message: `Synced ${items.length} currencies.` }).end();
  } catch (error) {
    next(error);
  }
};
