module.exports = {
  inputs: {
    user: {
      type: 'ref',
      required: true,
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = inputs;
      if (!user) {
        return exits.success('');
      }
      if (user.firstName) {
        return exits.success(`${user.firstName} ${user.lastName}`);
      }
      if (user.name) {
        return exits.success(user.name);
      }

      return exits.success('');
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error at helpers/user/name',
        e,
      );
      return exits.success('');
    }
  },
};
