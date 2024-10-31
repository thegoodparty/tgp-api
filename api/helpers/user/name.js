const { resolveUserName } = require('../../utils/user/resolveUserName');

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
      return exits.success(resolveUserName(user));
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error at helpers/user/name',
        e,
      );
      return exits.success('');
    }
  },
};
