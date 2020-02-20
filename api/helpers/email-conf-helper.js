module.exports = {
  friendlyName: 'Create Auth token for a user',

  inputs: {
    userId: {
      friendlyName: 'User Id',
      type: 'number',
      required: true,
    },
  },

  fn: async function(inputs, exits) {
    try {
      const userRecord = await User.findOne({ id: inputs.userId });
      if (!userRecord) {
        return exits.badRequest({ message: 'missing userId' });
      } //

      // Come up with a pseudorandom, probabilistically-unique token for use
      // in our email confirmation email.
      const token = await sails.helpers.strings.random('url-friendly');

      // Store the token on the user record
      // (This allows us to look up the user when the link from the email is clicked.)
      await User.update({ id: userRecord.id }).set({
        emailConfToken: token,
        emailConfTokenDateCreated:
          Date.now() + sails.config.custom.passwordResetTokenTTL,
      });

    } catch (e) {
      return exits.badRequest({ message: 'failed set token' });
    }
  },
};
