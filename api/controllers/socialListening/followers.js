const moment = require('moment');

module.exports = {
  friendlyName: 'Health',

  description: 'root level health check',

  inputs: {
    page: {
      type: 'number',
      required: true,
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
    const { page } = inputs;
    const perPage = 10;
    const from = perPage * (page - 1);
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

      // get all brands and profiles.
      const brands = await SocialBrand.find();
      const until = Math.min(from + perPage, brands.length);
      for (let i = from; i < until; i++) {
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

              const data = await sails.helpers.socialListening.pulsarQueryHelper(
                query,
                variables,
                'core',
              );
              if (data) {
                const record = await SocialStat.findOrCreate(
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
                  id: record.id,
                }).set({
                  count: data.followers,
                });
              }
            }
          } catch (e) {
            o
            // await sails.helpers.errorLoggerHelper('Error in followers loop', e);
          }
        }
        if (profiles.length > 0 && brands[i].candidate) {
          const candidate = await Candidate.findOne({
            id: brands[i].candidate,
          });
          if (candidate) {
            await sails.helpers.crm.updateCandidate(candidate);
          }
        }
      }

      await sails.helpers.cacheHelper('clear', 'all');

      return exits.success({
        message: 'ok',
        brandsCount: brands.length,
        page,
        perPage,
        pages: Math.ceil(brands.length / perPage),
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
