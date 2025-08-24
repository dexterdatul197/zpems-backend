const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');

/**
 * Invitation Schema
 * @private
 */
const invitationSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: 'String',
    ref: 'User',
    required: true,
  },
  expires: { type: Date },
});

invitationSchema.statics = {
  /**
   * Generate a token object and saves it into the database
   *
   * @param {User} user
   * @returns {Invitation}
   */
  async generate(user) {
    const userId = user._id;
    const userEmail = user.email;
    const token = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
    const expires = moment().add(2, 'hours').toDate();
    const invitation = new Invitation({
      token,
      userId,
      userEmail,
      expires,
    });
    await invitation.save();
    return invitation;
  },
};

/**
 * @typedef Invitation
 */
const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;
