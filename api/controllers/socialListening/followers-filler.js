const moment = require('moment');

module.exports = {
  friendlyName: 'Health',

  description: 'root level health check',

  inputs: {
    candidateId: {
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
    try {
      const { candidateId } = inputs;
      const query = `
       query Followers(
          $filter: Filter!
          $metric: StatMetric!
          $benchmark: Benchmark
        ) {
          followers(filter: $filter, metric: $metric, benchmark: $benchmark)
        }
      `;

      const candidate = await Candidate.findOne({ id: candidateId });
      const name = `${candidate.firstName} ${candidate.lastName}`;

      const brand = await SocialBrand.findOne({ name });
      if (!brand) {
        return exits.badRequest({
          error: true,
          message: 'brand not found. Make sure to run /brands endpoint first.',
        });
      }

      const { brandId, profiles } = brand;
      if (!profiles) {
        return exits.badRequest({
          error: true,
          message: 'no profiles found for this candidate.',
          brand,
        });
      }
      const brandRecordId = brand.id;
      for (let i = 0; i < 8; i++) {
        const date = moment()
          .subtract(i, 'days')
          .format('YYYY-MM-DD');

        for (let j = 0; j < profiles.length; j++) {
          try {
            const profile = profiles[j];
            const { id, source, name } = profile;
            if (profile) {
              const variables = {
                filter: {
                  dateFrom: `${date}T00:00:00Z`,
                  dateTo: `${date}T23:59:59Z`,
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
                    date,
                    channel: source,
                    action: 'followers',
                  },
                  {
                    channel: source,
                    socialBrand: brandRecordId,
                    name,
                    profileId: id,
                    date,
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
            await sails.helpers.errorLoggerHelper('Error in followers loop', e);
          }
        }
      }

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('error at socialListening/followers');
      console.log(e);
      return exits.badRequest({
        error: true,
        e,
        message: 'unknown error',
      });
    }
  },
};
