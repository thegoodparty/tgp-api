module.exports = {
  friendlyName: 'Find Campaign associated with user',

  inputs: {},

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
    notFound: {
      description: 'Candidate Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;
      let campaign = await sails.helpers.campaign.byUser(user.id);
      if (!campaign) {
        return exits.notFound();
      }
      const neededFix = await fixFailedAi(campaign);
      if (neededFix) {
        campaign = await Campaign.findOne({ id: campaign.id }).populate(
          'pathToVictory',
        );
      }
      delete campaign.user;
      delete campaign.createdAt;
      delete campaign.updatedAt;
      delete campaign.dataCopy;
      if (campaign.pathToVictory) {
        campaign.pathToVictory = campaign.pathToVictory.data;
      }

      return exits.success({
        campaign,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.forbidden();
    }
  },
};

async function fixFailedAi(campaign) {
  const aiContent = campaign.data;
  let needsUpdate = false;

  const campaignPlanStatus = aiContent.campaignPlanStatus;

  if (campaignPlanStatus) {
    for (const key in campaignPlanStatus) {
      if (campaignPlanStatus.hasOwnProperty(key)) {
        // detect and prune failed content.
        if (
          aiContent &&
          (!aiContent[key] || !aiContent[key].content) &&
          campaignPlanStatus[key] &&
          campaignPlanStatus[key].status === 'processing'
        ) {
          if (campaignPlanStatus[key].createdAt) {
            let createdAt = campaignPlanStatus[key].createdAt;
            let now = new Date().valueOf();
            let diff = now - createdAt;
            if (diff > 3600 * 1000) {
              campaignPlanStatus[key].status = 'failed';
              await sails.helpers.campaign.patch(
                campaign.id,
                'aiContent',
                key,
                false,
              );
              needsUpdate = true;
            }
          }
        }
      }
    }
  }

  if (needsUpdate) {
    await sails.helpers.campaign.patch(
      campaign.id,
      'aiContent',
      'campaignPlanStatus',
      campaignPlanStatus,
    );
  }
  return needsUpdate;
}
