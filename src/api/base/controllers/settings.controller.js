const httpStatus = require('http-status');
const Settings = require('../models/settings.model');
const { OpenAI } = require('openai');
const {
  loadNetsuitConnectionSettings,
  executeSuiteQLQuery,
} = require('../services/netsuite');

exports.get = async (req, res, next) => {
  try {
    const settings = await Settings.findOne({});

    if (req.user.role === 'user') {
      res.json({ expenseSettings: settings.settings });
      return;
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({});

    if (!settings) {
      settings = new Settings();
    }
    Object.keys(req.body).forEach((key) => {
      settings[key] = req.body[key];
    });

    const savedSettings = await settings.save();
    await loadNetsuitConnectionSettings();

    res.json(savedSettings);
  } catch (error) {
    next(error);
  }
};

exports.testNetsuiteConnection = async (req, res, next) => {
  try {
    const result = await executeSuiteQLQuery(`select * from expensecategory`);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

exports.testOpenAIConnection = async (req, res, next) => {
  try {
    const { openAIAPIKey } = req.body;
    const openai = new OpenAI({ apiKey: openAIAPIKey });
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Say this is a test' }],
      model: 'gpt-3.5-turbo',
    });

    const message = chatCompletion.choices[0].message.content;

    res.json({ ok: message.toLowerCase().includes('this is a test') });
  } catch (error) {
    next(error);
  }
};
