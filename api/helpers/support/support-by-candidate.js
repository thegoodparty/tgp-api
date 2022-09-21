const moment = require('moment');

module.exports = {
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function(inputs, exits) {
    try {
      const { id } = inputs;
      const support = await Support.count({ candidate: id });
      const lastWeek = moment().subtract(1, 'weeks');
      const lastWeekSupport = await Support.count({
        candidate: id,
        createdAt: { '<': new Date(lastWeek) },
      });

      return exits.success({
        thisWeek: support,
        lastWeek: lastWeekSupport,
      });
    } catch (e) {
      return exits.success({
        thisWeek: 0,
        lastWeek: 0,
      });
    }
  },
};
