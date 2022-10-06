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
      const candidates = await Candidate.find({ isActive: true });
      for (let i = 0; i < candidates.length; i++) {
        try {
          const data = JSON.parse(candidates[i].data);
          const { pulsarSearchId } = data;
          if (pulsarSearchId) {
            const queueMessage = {
              type: 'pulsarCandidateFeed',
              data: {
                pulsarSearchId,
              },
            };

            await sails.helpers.queue.enqueue(queueMessage);
          }
        } catch (e) {
          console.log('error in tiktok scrape loop', e);
        }
      }

      await sails.helpers.queue.consumer();

      return exits.success({
        message: 'ok',
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
