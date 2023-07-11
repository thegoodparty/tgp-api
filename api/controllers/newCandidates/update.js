/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const moment = require('moment');

module.exports = {
  friendlyName: 'Find by slug one Candidate',

  description: 'Find by slug one Candidate ',

  inputs: {
    candidate: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Candidate Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Candidate Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;
      const { candidate } = inputs;
      let slug;
      if (user.isAdmin) {
        slug = candidate.slug;
      } else {
        const campaigns = await Campaign.find({
          user: user.id,
        });
        let campaign = false;
        if (campaigns && campaigns.length > 0) {
          campaign = campaigns[0].data;
        }

        slug = campaign.candidateSlug;

        if (slug !== candidate.slug) {
          return exits.notFound();
        }
      }

      let candidateRecord = await Candidate.findOne({
        slug,
        isActive: true,
      });

      if (!candidateRecord) {
        return exits.notFound();
      }

      await Candidate.updateOne({ slug }).set({
        data: JSON.stringify(candidate),
      });

      let userObj = await User.findOne({ id: user.id });
      await sails.helpers.crm.updateUser(userObj, false, true);

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('Error in candidate update', e);
      return exits.notFound();
    }
  },
};
