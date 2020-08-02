module.exports = {
  friendlyName: 'Change password',

  description: 'Change password for a logged in user.',

  inputs: {
    oldPassword: {
      description: 'The old, unencrypted password.',
      example: 'abc123v2',
      required: true,
      minLength: 8,
      type: 'string',
      protect: true,
    },
    newPassword: {
      description: 'The new, unencrypted password.',
      example: 'abc123v2',
      required: true,
      minLength: 8,
      type: 'string',
      protect: true,
    },
  },

  exits: {
    success: {
      description: 'Password successfully updated.',
    },

    badRequest: {
      description: 'Error changing password',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    // Look up the user with this reset token.
    const user = this.req.user;
    const { oldPassword, newPassword } = inputs;
    try {
      // Hash the new password.
      try {
        await sails.helpers.passwords.checkPassword(oldPassword, user.password);
      } catch {
        return exits.badRequest({
          message: 'incorrect password',
          incorrect: true,
        });
      }
      const hashed = await sails.helpers.passwords.hashPassword(newPassword);

      // Store the user's new password and clear their reset token so it can't be used again.
      await User.updateOne({ id: user.id }).set({
        password: hashed,
      });
      // const token = await sails.helpers.jwtSign(userRecord);

      // Log the user in.
      return exits.success({ message: 'password successfully changed.' });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at user/change-password', e);
      return exits.badRequest();
    }
  },
};
