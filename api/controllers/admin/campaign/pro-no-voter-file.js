module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'found',
    },
    badRequest: {
      description: 'Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const campaigns = await Campaign.find({
        where: { user: { '!=': null }, isPro: true },
      })
        .populate('user')
        .populate('pathToVictory');
      let noVoterFile = [];
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const canDownload = await sails.helpers.campaign.canDownloadVoterFile(
          campaign.id,
        );
        if (!canDownload) {
          noVoterFile.push(campaign);
        }
      }
      return exits.success({
        campaigns: noVoterFile,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at admin/pro-no-voter-file',
        e,
      );
      return exits.badRequest({
        message: 'Error admin/pro-no-voter-file',
      });
    }
  },
};
