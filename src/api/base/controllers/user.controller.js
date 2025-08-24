const httpStatus = require('http-status');
const { omit } = require('lodash');
const User = require('../models/user.model');
const Expense = require('../models/expense.model');
const { executeSuiteQLQuery } = require('../services/netsuite');

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const user = await User.get(id);
    req.locals = { user };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user
 * @public
 */
exports.get = (req, res) => res.json(req.locals.user.transform());

/**
 * Get logged in user info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.user.transform());

/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(httpStatus.CREATED);
    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { user } = req.locals;
    const newUser = new User(req.body);
    const ommitRole = user.role !== 'admin' ? 'role' : '';
    const newUserObject = omit(newUser.toObject(), '_id', ommitRole);

    await user.updateOne(newUserObject, { override: true, upsert: true });
    const savedUser = await User.findById(user._id);

    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = async (req, res, next) => {
  const ommitRole =
    req.user.role !== 'admin' && req.locals.user.role !== 'admin' ? 'role' : '';
  const updatedUser = omit(req.body, ommitRole);
  const user = Object.assign(req.locals.user, updatedUser);

  try {
    const savedUser = await user.save();
    res.json(savedUser.transform());
  } catch (e) {
    console.log(e);
    next(User.checkDuplicateEmail(e));
  }

  // user
  //   .save()
  //   .then((savedUser) => res.json(savedUser.transform()))
  //   .catch((e) => next(User.checkDuplicateEmail(e)));
};

/**
 * Get user list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const users = await User.list(req.query);
    // const transformedUsers = users.map((user) => user.transform());
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @public
 */
exports.remove = async (req, res, next) => {
  try {
    const { user } = req.locals;

    const expenseCount = await Expense.countDocuments({
      deletedAt: null,
      attendee: { $in: [user.id] },
    });

    if (expenseCount > 0) {
      user.status = 'inactive';
      await user.save();
      res.json(user.transform());
    } else {
      await user.deleteOne();
      res.status(httpStatus.NO_CONTENT).end();
    }
  } catch (error) {
    next(error);
  }
};

exports.sync = async (req, res, next) => {
  try {
    const result = await executeSuiteQLQuery('select * from employee');
    const items = result.items.filter((x) => x.email).slice(0, 10) || [];

    // {
    //   links: [],
    //   btemplate: 'F',
    //   currency: '1',
    //   custentity_2663_payment_method: 'F',
    //   datecreated: '8/25/2023',
    //   defaultexpensereportcurrency: '1',
    //   eligibleforcommission: 'F',
    //   email: 'mavell@zeropointerp.io',
    //   entityid: 'Mavell Punzalan',
    //   firstname: 'Mavell',
    //   gender: 'b',
    //   giveaccess: 'F',
    //   globalsubscriptionstatus: '2',
    //   hiredate: '8/25/2023',
    //   i9verified: 'F',
    //   id: '968',
    //   initials: 'MP',
    //   isinactive: 'F',
    //   isjobmanager: 'F',
    //   isjobresource: 'F',
    //   issalesrep: 'F',
    //   issupportrep: 'F',
    //   lastmodifieddate: '8/30/2023',
    //   lastname: 'Punzalan',
    //   subsidiary: '1',
    //   targetutilization: '1',
    //   workcalendar: '1'
    // },

    // iterate items and create/update users
    let count = 0;
    for (const item of items) {
      const user = await User.findOne({ internalId: item.id });

      try {
        if (user) {
          user['name'] = item['entityid'];
          user['status'] = item['isinactive'] === 'T' ? 'inactive' : 'active';
          user['email'] = item['email'];
          user['role'] = 'user';
          await user.save();
        } else {
          await User.create({
            internalId: item.id,
            name: item['entityid'],
            email: item['email'],
            status: item['isinactive'] === 'T' ? 'inactive' : 'active',
            role: 'user',
            password: '123qweasd',
          });
        }
        count++;
      } catch (error) {
        console.log(error);
      }
    }

    // update all users that are not in the list to inactive
    // await User.updateMany(
    //   { role: 'user', internalId: { $nin: items.map((item) => item.id) } },
    //   { status: 'inactive' }
    // );

    res.json({ message: `Synced ${count}/${items.length} users.` });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const user = req.user;
    const { oldPassword, newPassword } = req.body;
    if (user && (await user.passwordMatches(oldPassword))) {
      user.password = newPassword;
      await user.save();
    } else {
      res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: 'Incorrect old password' });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};
