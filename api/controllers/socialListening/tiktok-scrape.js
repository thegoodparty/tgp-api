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
      const url = encodeURI('https://www.tiktok.com/@goodparty');
      const scraped = await sails.helpers.socialListening.tiktokScraperHelper(
        url,
      );
      if (!scraped) {
        return exits.badRequest({
          e: 'error scraping tiktok',
        });
      }
      const { followers } = scraped;

      const today = moment().format('YYYY-MM-DD');

      const gpId = 1;

      await SocialStat.findOrCreate(
        {
          socialBrand: gpId,
          profileId: gpId,
          date: today,
          channel: 'tiktok',
          action: 'followers',
        },
        {
          channel: 'tiktok',
          socialBrand: gpId,
          name: 'Good Party',
          profileId: gpId,
          date: today,
          action: 'followers',
          count: followers,
        },
      );

      await SocialStat.updateOne({
        socialBrand: gpId,
        profileId: gpId,
        date: today,
        channel: 'tiktok',
      }).set({
        count: followers,
      });

      return exits.success({
        followers,
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
