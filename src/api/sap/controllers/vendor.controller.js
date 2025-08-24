const httpStatus = require('http-status');

const Vendor = require('../models/vendor.model');
const User = require('../../base/models/user.model');
const Invitation = require('../../base/models/invitation.model');

exports.list = async (req, res, next) => {
  try {
    //filtering
    const queryOptions = {};

    // sorting
    let sorting = req.query.sorting;
    if (!sorting) {
      sorting = 'createdAt';
    }
    const sortOptions = {};
    const sortFields = sorting.split(',');
    sortFields.forEach((sortField) => {
      const sortOrder = sortField.startsWith('-') ? -1 : 1;
      const fieldName = sortField.replace(/^-/, '');
      sortOptions[fieldName] = sortOrder;
    });

    const vendors = await Vendor.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
    ])
      .match(queryOptions)
      .sort(sortOptions);

    res.json(vendors);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { contactName, companyName, email } = req.body;

    const newUser = new User({
      email,
      name: contactName,
      status: 'inactive',
      role: 'vendor',
      password: '123qweasd',
    });
    const savedUser = await newUser.save();

    const vendor = new Vendor({
      companyName,
      userId: savedUser._id,
    });

    await vendor.save();

    res.status(httpStatus.CREATED).json(vendor);
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);

    res.json(vendor);
  } catch (error) {
    next(error);
  }
};

exports.getByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const vendor = await Vendor.findOne({ userId: userId });

    res.json(vendor);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contactName, companyName } = req.body;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(httpStatus.NOT_FOUND).end();
    }

    vendor.contactName = contactName;
    vendor.companyName = companyName;

    vendor.save();

    res.json(vendor);
  } catch (error) {
    next(error);
  }
};

exports.updatePaymentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(httpStatus.NOT_FOUND).end();
    }

    Object.keys(req.body).forEach((key) => {
      vendor[key] = req.body[key];
    });

    const savedVender = await vendor.save();

    res.json(savedVender);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Vendor.findByIdAndDelete(id);

    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

exports.invite = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // TODO: check if user status is already active

    // Generate an invitation
    const invitation = await Invitation.generate(user);

    // TODO: don't hard code base url
    const invitationLink = `https://financeerpai.com/invitations/${invitation._id}?token=${invitation.token}`;

    res.status(200).json({
      message: 'Invitation sent successfully.',
      invitationLink,
    });
  } catch (error) {
    next(error);
  }
};
