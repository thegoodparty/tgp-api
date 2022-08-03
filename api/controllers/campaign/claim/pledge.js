/**
 * subscribe/subscribe-email.js
 *
 * @description :: Users can subscribe their email on the homepage
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Pledge after claim',

  inputs: {},

  exits: {
    success: {
      description: 'Claimed',
    },

    badRequest: {
      description: 'Error claiming campaign',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { user } = this.req;
      const claim = await CampaignClaim.findOne({
        user: user.id,
      });
      if (!claim) {
        return exits.badRequest({ message: 'Error saving pledge' });
      }

      await Staff.create({
        role: 'owner',
        user: user.id,
        candidate: claim.candidate,
        createdBy: user.id,
      });

      const candidate = await Candidate.findOne({ id: claim.candidate });
      const data = JSON.parse(candidate.data);
      await Candidate.updateOne({ id: candidate.id }).set({
        data: JSON.stringify({
          ...data,
          isClaimed: true,
        }),
      });
      await CampaignClaim.destroyOne({
        id: claim.id,
      });

      return exits.success({ candidateId: claim.candidate });
    } catch (err) {
      console.log(err)
      return exits.badRequest({ message: 'Error saving pledge' });
    }
  },
};
