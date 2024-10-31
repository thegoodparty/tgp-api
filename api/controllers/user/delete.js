const {
  handleCancelCampaign,
} = require('../../utils/campaign/event-handlers/handleCancelCampaign');
const { patchUserMetaData } = require('../../utils/user/patchUserMetaData');

const handleDeleteCandidateAssociatedData = async (user, campaign) => {
  const { details } = campaign || {};
  const { subscriptionId } = details || {};
  if (subscriptionId) {
    try {
      await handleCancelCampaign(campaign);
    } catch (e) {
      console.error(e);
      await sails.helpers.slack.errorLoggerHelper('Error user/delete', e);
    }
  }
  await CandidatePosition.destroy({
    campaign: campaign?.id,
  });

  await PathToVictory.destroyOne({ id: campaign.pathToVictory?.id });
  await CampaignVolunteer.destroy({
    campaign: campaign?.id,
  });
  await CampaignRequest.destroy({
    campaign: campaign?.id,
  });
  await Campaign.destroyOne({ id: campaign?.id });
};

const handleDeleteTeamMemberAssociatedData = async (user, campaign) => {
  await CampaignVolunteer.destroy({
    campaign: campaign.id,
    user: user.id,
  });
  await CampaignRequest.destroy({
    campaign: campaign.id,
    user: user.id,
  });
};

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

      if (!campaign) {
        console.log('No campaign found for user. Deleting user.');
        await User.destroyOne({ id: user.id });
        return exits.success({
          message: 'deleted successfully',
        });
      }

      await patchUserMetaData(user, { isDeleted: true });

      if (user.id === campaign.user) {
        await handleDeleteCandidateAssociatedData(user, campaign);
      } else {
        await handleDeleteTeamMemberAssociatedData(user, campaign);
      }

      await Notification.destroy({ user: user.id });
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
