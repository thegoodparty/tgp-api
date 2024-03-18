module.exports = {
  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'ok',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      await sails.helpers.queue.consumer();
      const { slug } = inputs;
      const campaign = await Campaign.findOne({ slug });
      campaign.data.p2vStatus = 'Waiting';
      await Campaign.updateOne({ slug }).set({ data: campaign.data });

      await sails.helpers.queue.enqueuePathToVictory(campaign);

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('Error path-to-victory', e);

      return exits.badRequest({ message: 'Error path-to-victory.' });
    }
  },
};
