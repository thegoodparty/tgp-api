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
      const { user, role } = await Requests.findOne({
        id: requestId,
        campaign: campaign.id,
      }).populate('user');

      await CampaignVolunteer.create({
        user: user.id,
        campaign: campaign.id,
        role,
      });

      await Requests.destroy({
        id: requestId,
      });

      return exits.success({
        message: 'Campaign Request granted successfully',
      });
    } catch (e) {
      console.error('error updating campaign request', e);
      return exits.error(e);
    }
  },
};
