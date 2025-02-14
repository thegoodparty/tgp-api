const { USER_ROLES } = require('../../models/users/User');

module.exports = {
  friendlyName: 'Update password and login',

  description: 'Finish the password recovery flow by setting the new password',

  inputs: {
    email: {
      description: 'Users email.',
      example: 'tomer@thegoodparty.org',
      isEmail: true,
      type: 'string',
      required: true,
    },

    password: {
      description: 'The new, unencrypted password.',
      example: 'abc123v2',
      type: 'string',
      required: true,
      minLength: 8,
    },

    token: {
      description:
        'The password token that was generated by the `sendPasswordRecoveryEmail` endpoint.',
      example: 'gwa8gs8hgw9h2g9hg29hgw',
      required: true,
      type: 'string',
    },
    adminCreate: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Password successfully updated.',
    },

    invalidToken: {
      description:
        'The provided password token is invalid, expired, or has already been used.',
      responseType: 'expired',
    },
    badRequest: {
      description: 'register Failed',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { email, password, token, adminCreate } = inputs;
      console.log('reset1', inputs);

      const lowerCaseEmail = email.toLowerCase();
      const user = await User.findOne({
        email: lowerCaseEmail,
        passwordResetToken: token,
      });

      console.log('reset2', user);

      // If no such user exists, or their token is expired, bail.
      if (!user || user.passwordResetTokenExpiresAt <= Date.now()) {
        return exits.badRequest({
          message: 'Token Expired.',
          expired: true,
        });
      }

      console.log('reset3');

      // Hash the new password.
      const hashed = await sails.helpers.passwords.hashPassword(password);

      // Store the user's new password and clear their reset token so it can't be used again.
      const updated = await User.updateOne({ id: user.id }).set({
        password: hashed,
        hasPassword: true,
        passwordResetToken: '',
        passwordResetTokenExpiresAt: 0,
      });

      console.log('reset4');

      if (adminCreate && user.role !== USER_ROLES.SALES) {
        // check if the campaign attached to this user is marked as created by admin
        const campaign = await sails.helpers.campaign.byUser(user.id);
        if (campaign.data.createdBy !== 'admin') {
          console.log('reset5', campaign.data);
          return exits.badRequest({
            message: 'This account was not created by an admin',
          });
        }
        const token = await sails.helpers.jwtSign({
          id: user.id,
          email: user.email,
        });
        console.log('reset6');
        return exits.success({
          user: updated,
          token,
        });
      }
      console.log('reset7');
      return exits.success({
        message: 'Password successfully updated.',
      });
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error at entrance/reset-password',
        e,
      );
      console.log('reset-password error', e);
      return exits.badRequest({ message: 'Error resetting password.' });
    }
  },
};
