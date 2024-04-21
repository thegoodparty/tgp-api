const camelToSentence = (text) => {
  const result = text.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

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
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.notFound();
      }

      // const campaign = campaignRecord.data;
      // const campaignId = campaignRecord.id;
      // campaign.id = campaignId;

      let updatedPlan;
      // if (campaign.campaignPlanStatus) {
      //   for (const key in campaign.campaignPlanStatus) {
      //     if (campaign.campaignPlanStatus.hasOwnProperty(key)) {
      //       // detect and prune failed content.
      //       if (
      //         campaign.aiContent &&
      //         (!campaign.aiContent[key] || !campaign.aiContent[key].content) &&
      //         campaign.campaignPlanStatus[key] &&
      //         campaign.campaignPlanStatus[key].status === 'processing'
      //       ) {
      //         if (campaign.campaignPlanStatus[key].createdAt) {
      //           let createdAt = campaign.campaignPlanStatus[key].createdAt;
      //           let now = new Date().valueOf();
      //           let diff = now - createdAt;
      //           if (diff > 3600 * 1000) {
      //             campaign.campaignPlanStatus[key].status = 'failed';
      //             delete campaign['aiContent'][key];
      //             updatedPlan = true;
      //           }
      //         }
      //       }
      //     }
      //   }
      // }

      // let updated = false;

      // if (updated === true || updatedPlan === true) {
      //   await Campaign.updateOne({
      //     id: campaignId,
      //   }).set({ data: campaign });
      // }

      // if (
      //   campaignRecord.isActive &&
      //   campaign.currentStep !== 'onboarding-complete'
      // ) {
      //   await Campaign.updateOne({
      //     id: campaignId,
      //   }).set({ data: { ...campaign, currentStep: 'onboarding-complete' } });
      // }

      delete campaign.user;
      delete campaign.createdAt;
      delete campaign.updatedAt;
      delete campaign.dataCopy;

      return exits.success({
        campaign,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.forbidden();
    }
  },
};
