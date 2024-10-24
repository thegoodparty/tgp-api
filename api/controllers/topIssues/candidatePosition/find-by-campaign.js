/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Find by slug one Candidate',

  description: 'Find by slug one Candidate ',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { slug } = inputs;
      let campaign = await Campaign.findOne({
        slug,
      });

      if (!campaign) {
        return exits.notFound();
      }

      let candidatePositions = await candidatePositionFinder(campaign.id);

      return exits.success({
        candidatePositions,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};

async function candidatePositionFinder(id) {
  return await CandidatePosition.find({ campaign: id })
    .sort([{ order: 'ASC' }])
    .populate('topIssue')
    .populate('position');
}
