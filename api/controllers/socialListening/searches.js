const moment = require('moment');

module.exports = {
  friendlyName: 'Health',

  description: 'root level health check',

  inputs: {
    page: {
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Healthy',
    },

    badRequest: {
      description: 'Error getting root health route',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { page } = inputs;
      const query = `
       query Searches($limit: Int, $page: Int) {
        searches(limit: $limit, page: $page) {
          total,
          searches {
            searchName,
            realtimeStatus,
            search,
            status
            }
          }
        }
      `;

      const variables = {
        filter: {
          page,
        },
      };

      const data = await sails.helpers.socialListening.pulsarQueryHelper(
        query,
        variables,
        'trac',
      );

      if (data && data.searches && data.searches.searches) {
        const results = data.searches.searches;
        for (let i = 0; i < results.length; i++) {
          const { searchName, realtimeStatus, search, status } = results[i];
          if (realtimeStatus === 'STARTED' && status === 'READY') {
            const name = searchName.split(' ');
            const candidate = await Candidate.findOne({
              firstName: name[0],
              lastName: name[name.length - 1],
            });
            if (candidate) {
              const data = JSON.parse(candidate.data);
              await Candidate.updateOne({ id: candidate.id }).set({
                data: JSON.stringify({
                  ...data,
                  pulsarSearchId: search,
                }),
              });
              console.log('candidate found', candidate);

            }
          }
        }
      }

      return exits.success({
        message: 'ok',
        data,
      });
    } catch (e) {
      console.log('error at socialListening/searches');
      console.log(e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
