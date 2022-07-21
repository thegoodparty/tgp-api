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
    const { searchId, limit, save, useCache } = inputs;
    const cacheKey = `${searchId}-${limit}`;
    if (useCache) {
      const existing = await KeyValue.findOne({ key: cacheKey });
      if (existing) {
        return exits.success(JSON.parse(existing.value));
      }
    }
    try {
      const query = `
        query SearchPosts($stat: Stat, $dimension: Dimension, $options: Option, $filter: Filter!) {
          results(stat: $stat, dimension: $dimension, options: $options, filter: $filter) {
            total
            results {
              content
              source
              engagement
              likesCount
              commentsCount
              url
              images
              userName
              userScreenName
              publishedAt
              videos
            }
          }
        }
      `;

      const today = moment().format('YYYY-MM-DD');
      const variables = {
        filter: {
          dateFrom: `2022-04-01T23:59:59Z`,
          dateTo: `${today}T23:59:59Z`,
          searches: [searchId],
          tags: ['53434'],
        },
        options: {
          sortBy: 'REACTION',
          limit,
        },
      };

      const data = await sails.helpers.socialListening.pulsarQueryHelper(
        query,
        variables,
        'trac',
      );

      const results = data ? data.results : [];
      if (save) {
        const resultsStr = JSON.stringify(results);
        await KeyValue.findOrCreate(
          { key: cacheKey },
          {
            key: cacheKey,
            value: resultsStr,
          },
        );
        await KeyValue.updateOne({ key: cacheKey }).set({
          key: cacheKey,
          value: resultsStr,
        });
      }

      return exits.success(results);
    } catch (e) {
      console.log('error at socialListening/goodparty-search');
      console.log(e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
