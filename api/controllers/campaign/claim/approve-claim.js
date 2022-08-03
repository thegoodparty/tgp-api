/**
 * subscribe/subscribe-email.js
 *
 * @description :: Users can subscribe their email on the homepage
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Approve claim and move to the pledge (admin)',

  inputs: {
    email: {
      required: true,
      type: 'string',
      isEmail: true,
    },
    candidateId: {
      required: true,
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Claim approved',
    },

    badRequest: {
      description: 'Error claiming campaign',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { email, candidateId } = inputs;
      const lowerEmail = email.toLowerCase();

      const user = await User.findOne({ email: lowerEmail });
      if (!user) {
        return exits.badRequest({
          message: `user with email ${email} doesn't exist in our system`,
          noUser: true,
        });
      }

      const existingClaim = await CampaignClaim.findOne({
        user: user.id,
      });
      if (existingClaim) {
        await CampaignClaim.destroyOne({ id: existingClaim.id });
      }

      await CampaignClaim.create({
        user: user.id,
        candidate: candidateId,
      });

      //send email here
      const formId = '6c52b3d2-6642-4be3-b12a-c6b857b4a554';

      const crmFields = [
        { name: 'email', value: user.email, objectTypeId: '0-1' },
      ];

      await sails.helpers.crm.submitForm(
        formId,
        crmFields,
        'Candidate Protal Admin Page',
        `/candidate/portal/admin/${candidateId}`,
      );

      return exits.success({ message: 'success' });
    } catch (err) {
      console.log('error', e);
      return exits.badRequest({ message: 'Error approving claim' });
    }
  },
};
