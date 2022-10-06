module.exports = {
  friendlyName: 'Pulsar Social listening for brands',

  inputs: {
    page: {
      type: 'number',
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
      for (let i = 0; i < 12; i++) {
        const queueMessage = {
          type: 'pulsarSearches',
          data: {
            page: i + 1,
          },
        };

        await sails.helpers.queue.enqueue(queueMessage);
      }
      await sails.helpers.queue.consumer();

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('error at socialListening/brands');
      console.log(e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
