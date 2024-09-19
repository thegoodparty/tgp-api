module.exports = {
  friendlyName: 'DeleteCampaignTeamRequest',

  description: 'Delete a request to join a campaign team',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Campaign Request was deleted.',
    },
    error: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { id: requestId } = inputs;
    const { user } = this.req;
    const campaign = await sails.helpers.campaign.byUser(user.id);

    const whereParams = campaign
      ? { campaign: campaign.id }
      : { user: user.id };

    try {
      await CampaignRequest.destroy({
        id: requestId,
        ...whereParams,
      });

      return exits.success({
        message: 'Campaign Request deleted successfully',
      });
    } catch (e) {
      console.error('error deleting campaign request', e);
      return exits.error(e);
    }
  },
};
