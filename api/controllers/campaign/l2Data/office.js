module.exports = {
  friendlyName: 'L2 Office',

  description: 'Get L2 Office',

  inputs: {
    campaignId: {
      type: 'string',
    },
    runAll: {
      type: 'boolean',
      default: false,
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
      const { campaignId, runAll } = inputs;

      await sails.helpers.queue.consumer();

      if (runAll === true) {
        await sails.helpers.campaign.processVictory();
      } else {
        if (!campaignId) {
          return exits.badRequest({
            error: true,
            message: 'Campaign ID is required',
          });
        }
        let campaign = await Campaign.findOne({
          id: campaignId,
        });

        await sails.helpers.queue.enqueuePathToVictory(campaign);
      }

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
