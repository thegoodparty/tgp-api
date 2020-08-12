module.exports = {
  friendlyName: 'Confirm Email with token',

  description: 'Confirm Email with token',

  inputs: {
    email: {
      description: 'The email address of the alleged user who wants to Confirm',
      example: 'rydahl@example.com',
      type: 'string',
      required: true,
    },
    token: {
      description: 'Token that should match the user records',
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Email is confirmed',
    },
    badRequest: {
      description: 'Confirmation Failed',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    const { email, token } = inputs;
    const lowerCaseEmail = email.toLowerCase();

    const userRecord = await User.findOne({ email: lowerCaseEmail });
    if (!userRecord) {
      return exits.badRequest({
        message: 'Failed to confirm email. Missing email.',
      });
    }

    if (userRecord.emailConfToken !== token) {
      return exits.badRequest({
        message: 'Failed to confirm email. Invalid token.',
      });
    }
    const isExpired =
      userRecord.emailConfTokenDateCreated +
        sails.config.custom.passwordResetTokenTTL <
      Date.now();

    if (userRecord.emailConfToken === token && isExpired) {
      return exits.badRequest({
        message: 'Token Expired.',
        expired: true,
      });
    }

    if (userRecord.emailConfToken === token) {
      const user = await User.updateOne({ email: lowerCaseEmail }).set({
        emailConfToken: '',
        emailConfTokenDateCreated: '',
        isEmailVerified: true,
      });

      const token = await sails.helpers.jwtSign({
        id: user.id,
        email: lowerCaseEmail,
      });

      const userWithZip = await User.findOne({ id: user.id });

      const zipCode = await ZipCode.findOne({
        id: userWithZip.zipCode,
      }).populate('cds');
      userWithZip.zipCode = zipCode;

      return exits.success({
        user: userWithZip,
        token,
      });
    }
  },
};
