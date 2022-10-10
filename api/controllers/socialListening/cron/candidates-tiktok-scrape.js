const moment = require('moment');

module.exports = {
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
      let added = 0;
      const candidates = await Candidate.find({ isActive: true });
      for (let i = 0; i < candidates.length; i++) {
        try {
          const data = JSON.parse(candidates[i].data);
          const { tiktok, firstName, lastName } = data;
          if (tiktok) {
            const today = moment().format('YYYY-MM-DD');
            const name = `${firstName} ${lastName}`;

            const queueMessage = {
              type: 'candidateTikTokScrape',
              data: {
                tiktok,
                today,
                name,
              },
            };

            await sails.helpers.queue.enqueue(queueMessage);
            added++;
          }
        } catch (e) {
          console.log('error in tiktok scrape loop', e);
        }
      }

      await sails.helpers.queue.consumer();

      return exits.success({
        message: 'ok',
        added,
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
