const moment = require('moment');

module.exports = {
  friendlyName: 'Pulsar Social listening for brands',

  inputs: {
    searchId: {
      type: 'string',
    },
    limit: {
      type: 'number',
      defaultsTo: 10,
    },
    save: {
      type: 'boolean',
      defaultsTo: false,
    },
    useCache: {
      type: 'boolean',
      defaultsTo: true,
    },
    filterApproved: {
      type: 'boolean',
      defaultsTo: true,
    },
  },

  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { searchId, limit, save, useCache, filterApproved } = inputs;
      const results = await sails.helpers.socialListening.searchResultsHelper(
        searchId,
        limit,
        save,
        useCache,
        filterApproved,
      );

      return exits.success(results);
    } catch (e) {
      console.log('error at socialListening/search-results');
      console.log(e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
