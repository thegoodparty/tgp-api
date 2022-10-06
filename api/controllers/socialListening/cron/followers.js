const moment = require('moment');

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'enqueued',
    },

    badRequest: {
      description: 'Error enqueuing',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const today = moment().format('YYYY-MM-DD');

      // get all brands and profiles.
      const brands = await SocialBrand.find();
      for (let i = 0; i < brands.length; i++) {
        const { brandId, profiles } = brands[i];
        const brandRecordId = brands[i].id;

        for (let j = 0; j < profiles.length; j++) {
          try {
            const profile = profiles[j];
            if (profile) {
              const { id, source, name } = profile;
              const variables = {
                filter: {
                  dateFrom: `${today}T00:00:00Z`,
                  dateTo: `${today}T23:59:59Z`,
                  brandId,
                  profiles: [id],
                },
                metric: 'COUNT',
              };

              const queueMessage = {
                type: 'pulsarFollowers',
                data: {
                  variables,
                  date: today,
                  id,
                  source,
                  brandRecordId,
                  name,
                },
              };

              await sails.helpers.queue.enqueue(queueMessage);
            }
          } catch (e) {
            console.log('Error in followers loop', e);
          }
        }
      }
      await sails.helpers.queue.consumer();

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('error at socialListening/followers');
      console.log(e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
