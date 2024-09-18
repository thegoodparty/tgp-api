module.exports = {
  inputs: {
    email: {
      type: 'string',
      isEmail: true,
      required: true,
    },
  },

  exits: {
    success: {
      outputDescription: 'User Found',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { email } = inputs;

      const user = await User.findOne({
        email,
      });

      if (!user) {
        throw new Error('No campaigns found for given user');
      }

      return exits.success(user);
    } catch (e) {
      console.error('error getting user', e);
      return exits.success(false);
    }
  },
};
