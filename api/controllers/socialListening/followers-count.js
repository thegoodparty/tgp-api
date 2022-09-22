const moment = require('moment');

const fallbackTotal = 1238;

module.exports = {
  friendlyName: 'Social Followers count',

  inputs: {
    brand: {
      type: 'string',
    },
    showChannels: {
      type: 'boolean',
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
      const { brand, showChannels } = inputs;
      let brandId = 1; // good party socialBrand id
      if (brand) {
        const brandRecord = await SocialBrand.find({ name: brand });
        if (brandRecord && brandRecord.id) {
          brandId = brandRecord.id;
        } else {
          return exits.badRequest({
            message: `Brand name ${brand} doesn't exist`,
          });
        }
      }

      const today = moment().format('YYYY-MM-DD');

      const stats = await SocialStat.find({
        socialBrand: brandId,
        date: today,
        action: 'followers',
      });

      if (stats.length > 0) {
        let total = 0;
        let tiktokFound = false;
        stats.forEach(stat => {
          total += stat.count;
          if (stat.channel === 'tiktok') {
            tiktokFound = true;
          }
        });
        // if tiktok is not found, try tiktok from yesterday
        if (!tiktokFound) {
          const yesterday = moment()
            .subtract(1, 'days')
            .format('YYYY-MM-DD');

          const stat = await SocialStat.findOne({
            socialBrand: brandId,
            date: yesterday,
            action: 'followers',
            channel: 'tiktok',
          });
          if (stat) {
            total += stat.count;
          }
        }

        return exits.success({
          total,
          channels: showChannels ? stats : undefined,
        });
      } else {
        // try yesterday
        const yesterday = moment()
          .subtract(1, 'days')
          .format('YYYY-MM-DD');

        const stats = await SocialStat.find({
          socialBrand: brandId,
          date: yesterday,
          action: 'followers',
        });

        if (stats.length > 0) {
          let total = 0;
          stats.forEach(stat => (total += stat.count));
          return exits.success({
            total,
            channels: showChannels ? stats : undefined,
          });
        }
      }

      // await sails.helpers.errorLoggerHelper(
      //   'Used fallback followers on socialListening/follower-count',
      //   {},
      // );
      return exits.success({
        total: fallbackTotal,
      });
    } catch (e) {
      console.log('error at socialListening/followers');
      console.log(e);
      // await sails.helpers.errorLoggerHelper(
      //   'error at socialListening/followers',
      //   e,
      // );

      return exits.success({
        error: true,
        total: fallbackTotal,
      });
    }
  },
};
