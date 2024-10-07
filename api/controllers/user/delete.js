const {
  handleCancelCampaign,
} = require('../../utils/campaign/event-handlers/handleCancelCampaign');
const { patchUserMetaData } = require('../../utils/user/patchUserMetaData');
module.exports = {
  friendlyName: 'Delete User',

  description: 'delete user',

  inputs: {},

  exits: {
    success: {
      description: 'User Deleted',
    },
    badRequest: {
      description: 'Error Deleting User',
      responseType: 'badRequest',
    },
    forbidden: {
      description: 'This action is allowed only on dev.',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;
      await ShareCandidate.destroy({ user: user.id });
      await Application.destroy({ user: user.id });
      const campaign = await sails.helpers.campaign.byUser(user.id);
      campaign.user = await User.findOne({ id: user.id });
      const { details } = campaign || {};
      const { subscriptionId } = details || {};
      await patchUserMetaData(user, { isDeleted: true });
      if (subscriptionId) {
        try {
          await handleCancelCampaign(campaign);
        } catch (e) {
          console.error(e);
          await sails.helpers.slack.errorLoggerHelper('Error user/delete', e);
          return e;
        }
      }
      // TODO: this needs to support a CM deleting their own account,
      //  and should NOT delete things on the associated campaign.
      await CandidatePosition.destroy({
        campaign: campaign?.id,
      });
      // TODO: Same here.
      await PathToVictory.destroyOne({ id: campaign.pathToVictory?.id });
      await CampaignVolunteer.destroy({
        or: [
          {
            user: user.id,
          },
          {
            campaign: campaign?.id,
          },
        ],
      });
      await CampaignRequest.destroy({
        or: [
          {
            user: user.id,
          },
          {
            campaign: campaign?.id,
          },
        ],
      });
      await Campaign.destroyOne({ id: campaign?.id });
      await User.destroyOne({ id: user.id });
      return exits.success({
        message: 'deleted successfully',
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('Error user/delete', e);
      return exits.badRequest({
        message: 'Error Deleting User',
      });
    }
  },
};
