const moment = require('moment');

module.exports = {
  friendlyName: 'Pulsar Social listening for brands',

  inputs: {
    page: {
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
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { page } = inputs;
      const perPage = 20;
      const from = perPage * (page - 1);

      const candidates = await Candidate.find();
      const until = Math.min(from + perPage, candidates.length);
      let updated = 0;
      for (let i = from; i < until; i++) {
        try {
          const data = JSON.parse(candidates[i].data);
          const { tiktok, firstName, lastName } = data;
          if (tiktok) {
            const scraped = await sails.helpers.socialListening.tiktokScraperHelper(
              tiktok,
            );
            if (scraped) {
              const { followers } = scraped;
              const today = moment().format('YYYY-MM-DD');
              const name = `${firstName} ${lastName}`;

              const brand = await SocialBrand.findOne({ name });
              if (brand) {
                const brandId = brand.id;

                await SocialStat.findOrCreate(
                  {
                    socialBrand: brandId,
                    profileId: brandId,
                    date: today,
                    channel: 'tiktok',
                    action: 'followers',
                  },
                  {
                    channel: 'tiktok',
                    socialBrand: brandId,
                    name,
                    profileId: brandId,
                    date: today,
                    action: 'followers',
                    count: followers,
                  },
                );

                await SocialStat.updateOne({
                  socialBrand: brandId,
                  profileId: brandId,
                  date: today,
                  channel: 'tiktok',
                }).set({
                  count: followers,
                });
                console.log('updated', updated);
                updated++;
              }
            }
          }
        } catch (e) {
          console.log('error in tiktok scrape loop', e);
        }
      }

      await sails.helpers.cacheHelper('clear', 'all');

      return exits.success({
        updated,
        candidatesCount: candidates.length,
        page,
        perPage,
        pages: Math.ceil(candidates.length / perPage),
      });
    } catch (e) {
      console.log('error at socialListening/brands');
      console.log(e);
      return exits.badRequest({
        e,
      });
    }
  },
};
