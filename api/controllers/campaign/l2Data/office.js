module.exports = {
  friendlyName: 'L2 Office',

  description: 'Get L2 Office',

  inputs: {
    campaignId: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Ok',
    },

    badRequest: {
      description: 'Error getting l2 office',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      // this view is just for testing the enqueuePathToVictory function
      const { campaignId } = inputs;

      let campaign = await Campaign.findOne({
        id: campaignId,
      });

      await sails.helpers.queue.enqueuePathToVictory(campaign);

      await sails.helpers.queue.consumer();

      return exits.success({
        success: true,
      });
    } catch (e) {
      console.log('error at l2Data/office', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
