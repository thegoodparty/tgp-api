// create campaignVolunteer via accepting VolunteerInvitation
const {
  updateCrmUserByUserId,
} = require('../../../utils/crm/updateCrmUserByUserId');
module.exports = {
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    const { id } = inputs;
    const user = this.req.user;

    try {
      const invitation = await VolunteerInvitation.findOne({
        email: user.email,
        id,
      });
      if (!invitation) {
        return exits.badRequest('No invitation');
      }

      await CampaignVolunteer.create({
        role: invitation.role,
        campaign: invitation.campaign,
        user: user.id,
      });

      await VolunteerInvitation.destroyOne({ id });

      return exits.success({
        message: 'accepted',
      });
    } catch (e) {
      console.log('Error accepting invitation', e);
      return exits.badRequest({ message: 'Error accepting invitation.' });
    } finally {
      await sails.helpers.fullstory.customAttr(requestorUserId);
      await updateCrmUserByUserId(requestorUserId);
    }
  },
};
