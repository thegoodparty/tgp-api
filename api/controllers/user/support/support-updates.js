module.exports = {
  friendlyName: 'User supports updates feed',

  inputs: {},

  exits: {
    success: {
      description: 'found',
    },

    badRequest: {
      description: 'Error finding',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let reqUser = this.req.user;
      const supports = await Support.find({
        user: reqUser.id,
      });
      let updates = [];

      for (let i = 0; i < supports.length; i++) {
        const campaignUpdates = await CampaignUpdate.find({
          candidate: supports[i].candidate,
        }).populate('candidate');
        updates = updates.concat(campaignUpdates);
      }

      return exits.success({
        updates,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error finding supports',
      });
    }
  },
};
