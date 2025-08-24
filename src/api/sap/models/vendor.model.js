const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    type: {
      type: String,   // 1: Individual, 2: Company
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
    },
    phoneCode: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    middleName: {
      type: String,
    },
    lastName: {
      type: String,
      required: true,
    },
    company: {
      type: String,
    },
    address1: {
      type: String,
      required: true,
    },
    address2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
  },
);

const methodSchema = new mongoose.Schema(
  {
    method: {
      type: String,   // 1: Check, 2: Other
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    nameOnCheck: {
      type: String,
      required: true,
    },
    addressToSend: {
      type: String,
      required: true,
    },
  },
);

const vendorSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
    },
    address: addressSchema,
    method: methodSchema,
    // email: {
    //   type: String,
    //   required: true,
    // },

    // contactName: {
    //   type: String,
    //   required: true,
    // },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SapVendor', vendorSchema);
