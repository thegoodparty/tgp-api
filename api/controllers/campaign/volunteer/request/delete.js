const {
  updateCrmUserByUserId,
} = require('../../../../utils/crm/updateCrmUserByUserId');
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

    let requestorUserId = null;
    try {
      const deletedRequest = await CampaignRequest.destroyOne({
        id: requestId,
        ...whereParams,
      });

      requestorUserId = deletedRequest?.user;

      return exits.success({
        message: 'Campaign Request deleted successfully',
      });
    } catch (e) {
      console.error('error deleting campaign request', e);
      return exits.error(e);
    } finally {
      await sails.helpers.fullstory.customAttr(requestorUserId);
      await updateCrmUserByUserId(requestorUserId);
    }
  },
};
