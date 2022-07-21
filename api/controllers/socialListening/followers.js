const moment = require('moment');

module.exports = {
  friendlyName: 'Health',

  description: 'root level health check',

  inputs: {},

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
      const query = `
       query Followers(
          $filter: Filter!
          $metric: StatMetric!
          $benchmark: Benchmark
        ) {
          followers(filter: $filter, metric: $metric, benchmark: $benchmark)
        }
      `;
      const today = moment().format('YYYY-MM-DD');

      const stats = await SocialStat.find();

      // get all brands and profiles.
      const brands = await SocialBrand.find();
      for (let i = 0; i < brands.length; i++) {
        const { brandId, profiles } = brands[i];
        const brandRecordId = brands[i].id;

        console.log('profiles type', typeof profiles);
        console.log('profiles', profiles);

        for (let j = 0; j < profiles.length; j++) {
          const profile = profiles[j];
          const { id, source, name } = profile;
          if (profile) {
            const variables = {
              filter: {
                dateFrom: `${today}T00:00:00Z`,
                dateTo: `${today}T23:59:59Z`,
                brandId,
                profiles: [id],
              },
              metric: 'COUNT',
            };

            const data = await sails.helpers.socialListening.pulsarQueryHelper(
              query,
              variables,
              'core',
            );
            if (data) {
              await SocialStat.findOrCreate(
                {
                  socialBrand: brandRecordId,
                  profileId: id,
                  date: today,
                  channel: source,
                  action: 'followers',
                },
                {
                  channel: source,
                  socialBrand: brandRecordId,
                  name,
                  profileId: id,
                  date: today,
                  action: 'followers',
                  count: data.followers,
                },
              );

              await SocialStat.updateOne({
                socialBrand: brandRecordId,
                profileId: id,
                date: today,
                channel: source,
              }).set({
                count: data.followers,
              });
            }
          }
        }
      }

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
