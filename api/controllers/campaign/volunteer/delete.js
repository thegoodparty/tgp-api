const {
  userCanMutateCampaignVolunteer,
} = require('../../../utils/campaign/userCanMutateCampaignVolunteer');
module.exports = {
  friendlyName: 'Delete campaign volunteer',
  description: 'Delete a campaign volunteer',
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'Campaign volunteer deleted',
    },
    notFound: {
      description: 'Campaign volunteer not found',
    },
    badRequest: {
      description: 'Error deleting campaign volunteer',
    },
  },
  fn: async function (inputs, exits) {
    const { id: campaignVolunteerId } = inputs;
    const { user: authenticatedUser } = this.req;
    let volunteerUserId = null;

    try {
      if (!campaignVolunteerId) {
        return exits.badRequest({
          message: 'Campaign volunteer id is required',
        });
      }

      if (
        !(await userCanMutateCampaignVolunteer(
          authenticatedUser.id,
          campaignVolunteerId,
        ))
      ) {
        return exits.badRequest({
          message:
            'Authenticated user not allowed to delete campaign volunteer',
        });
      }

      volunteerUserId = await CampaignVolunteer.destroyOne({
        id: campaignVolunteerId,
      });
      return exits.success({ message: 'Campaign volunteer deleted' });
    } catch (e) {
      console.error('error deleting campaign volunteer', e);
      return exits.badRequest({ message: 'Error deleting campaign volunteer' });
    } finally {
      await sails.helpers.fullstory.customAttr(volunteerUserId);
    }
  },
};
