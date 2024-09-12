module.exports = {
  friendlyName: 'UpdateCampaignTeamRequest',

  description: 'Update a request to join a campaign team',

  inputs: {},

  exits: {
    success: {
      description: 'Campaign Request was updated.',
    },
    error: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { params, user } = this.req;
    const campaign = await sails.helpers.campaign.byUser(user.id);
    const { requestId } = params || {};

    if (!campaign) {
      throw new Error('No campaign found for authenticated user');
    }

    try {
      const updated = await Requests.updateOne({
        id: requestId,
      }).set({
        granted: true,
        campaign: campaign.id,
      });

      console.log(`updated =>`, updated);

      return exits.success(updated);
    } catch (e) {
      console.error('error updating campaign request', e);
      return exits.error(e);
    }
  },
};
