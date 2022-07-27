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
    refreshCacheDaily: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function(inputs, exits) {
    const {
      searchId,
      limit,
      save,
      useCache,
      filterApproved,
      refreshCacheDaily,
    } = inputs;
    const cacheKey = `${searchId}-${limit}`;
    if (useCache) {
      if (refreshCacheDaily) {
        const stringDate = moment()
          .subtract(1, 'days')
          .format('M D, YYYY');
        const existing = await KeyValue.findOne({
          key: cacheKey,
          updatedAt: { '>': new Date(stringDate) },
        });
        if (existing) {
          return exits.success(JSON.parse(existing.value));
        }
      } else {
        const existing = await KeyValue.findOne({ key: cacheKey });
        if (existing) {
          return exits.success(JSON.parse(existing.value));
        }
      }
    }
    try {
      const query = `
        query SearchPosts($stat: Stat, $dimension: Dimension, $options: Option, $filter: Filter!) {
          results(stat: $stat, dimension: $dimension, options: $options, filter: $filter) {
            total
            results {
              title
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
          tags: filterApproved ? ['53434'] : undefined,
          sentiments: filterApproved ? undefined : ['POSITIVE', 'NEUTRAL'],
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

      if (filterApproved) {
        const queryTotal = `
        query SearchPosts($stat: Stat, $dimension: Dimension, $options: Option, $filter: Filter!) {
          results(stat: $stat, dimension: $dimension, options: $options, filter: $filter) {
            total
          }
        }
      `;

        const variablesTotal = { ...variables };
        delete variablesTotal.filter.tags;

        const dataTotal = await sails.helpers.socialListening.pulsarQueryHelper(
          queryTotal,
          variablesTotal,
          'trac',
        );
        results.total = dataTotal ? dataTotal.results.total : 100;
      }

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
