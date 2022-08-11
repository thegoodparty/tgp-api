const moment = require('moment');

module.exports = {
  friendlyName: 'Pulsar Social listening for brands',

  inputs: {},

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
      const candidates = await Candidate.find();
      let updated = 0;
      for (let i = 0; i < candidates.length; i++) {
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

      return exits.success({
        updated,
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
