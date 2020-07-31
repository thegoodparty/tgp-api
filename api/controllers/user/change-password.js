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
    },
    newPassword: {
      description: 'The new, unencrypted password.',
      example: 'abc123v2',
      required: true,
      minLength: 8,
      type: 'string',
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
      await sails.helpers.passwords.checkPassword(
        oldPassword,
        user.password,
      );
      const hashed = await sails.helpers.passwords.hashPassword(newPassword);

      // Store the user's new password and clear their reset token so it can't be used again.
      const userRecord = await User.updateOne({ id: user.id }).set({
        password: hashed,
      });
      // const token = await sails.helpers.jwtSign(userRecord);

      // Log the user in.
      return exits.success({ message: 'password successfully updated' });
    } catch (e) {
      console.log(e);
      return exits.badRequest();
    }
  },
};
