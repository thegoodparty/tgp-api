module.exports = {
  friendlyName: 'Wakeup DB',

  inputs: {},

  exits: {
    success: {
      description: 'I am awake.',
    },
    serverError: {
      description: 'There was a problem on the server.',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;
      const campaign = await sails.helpers.campaign.byUser(user);
      const canDownload = await sails.helpers.campaign.canDownloadVoterFile(
        campaign.id,
      );
      return exits.success(canDownload);
    } catch (error) {
      console.error('Error at can download:', error);
      return exits.success(false);
    }
  },
};
