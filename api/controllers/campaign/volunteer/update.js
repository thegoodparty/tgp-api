const {
  userCanMutateCampaignVolunteer,
} = require('../../../utils/campaign/userCanMutateCampaignVolunteer');

module.exports = {
  friendlyName: 'Update campaign volunteer',
  description: 'Update a campaign volunteer',
  inputs: {
    id: {
      type: 'number',
    },
    role: {
      type: 'string',
      isIn: ['volunteer', 'staff', 'candidate', 'manager'],
    },
    campaign: {
      type: 'number',
    },
    user: {
      type: 'number',
    },
  },
  exits: {
    success: {
      description: 'Campaign volunteer updated',
    },
    notFound: {
      description: 'Campaign volunteer not found',
    },
    badRequest: {
      description: 'Error updating campaign volunteer',
    },
  },
  fn: async function (inputs, exits) {
    const {
      id: campaignVolunteerId,
      role: newRole,
      campaign: newCampaignId,
      user: newUserId,
    } = inputs;
    let volutneerUserId = null;

    const { user: authenticatedUser } = this.req;
    try {
      if (!campaignVolunteerId) {
        return exits.badRequest({
          message: 'Campaign volunteer id is required',
        });
      }

      const campaignVolunteer = await CampaignVolunteer.findOne({
        id: campaignVolunteerId,
      }).populate('campaign');

      if (!campaignVolunteer) {
        return exits.notFound({ message: 'Campaign volunteer not found' });
      }

      if (
        !(await userCanMutateCampaignVolunteer(
          authenticatedUser.id,
          campaignVolunteerId,
        ))
      ) {
        return exits.badRequest({
          message:
            'Authenticated user not allowed to update campaign volunteer',
        });
      }

      await CampaignVolunteer.updateOne({ id: campaignVolunteerId }).set({
        ...{
          role: campaignVolunteer.role,
          campaign: campaignVolunteer.campaign,
          user: campaignVolunteer.user,
        },
        ...(newRole ? { role: newRole } : {}),
        ...(newCampaignId ? { campaign: newCampaignId } : {}),
        ...(newUserId ? { user: newUserId } : {}),
      });
      volutneerUserId = newUserId || campaignVolunteer.user;
      return exits.success({ message: 'Campaign volunteer updated' });
    } catch (e) {
      return exits.badRequest({ message: 'Error updating campaign volunteer' });
    } finally {
      await sails.helpers.fullstory.customAttr(volutneerUserId);
    }
  },
};
