module.exports = {
  friendlyName: 'Add password',

  description: 'Add password for a logged in user without one.',

  inputs: {
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
      description: 'Password successfully added.',
    },

    badRequest: {
      description: 'Error adding password',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    // Look up the user with this reset token.
    const user = this.req.user;
    const { newPassword } = inputs;
    try {
      if (user.password) {
        return exits.badRequest({
          message: 'User already has a password',
        });
      }
      const hashed = await sails.helpers.passwords.hashPassword(newPassword);
      // Store the user's new password and clear their reset token so it can't be used again.
      const updatedUser = await User.updateOne({ id: user.id }).set({
        password: hashed,
        haasPassword: true,
      });

      return exits.success({ user: updatedUser });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at user/change-password', e);
      return exits.badRequest();
    }
  },
};
