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
    slug: {
      type: 'string',
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
      const { slug } = inputs;
      let candidate = await Candidate.findOne({
        slug,
        isActive: true,
      });

      if (!candidate) {
        return exits.notFound();
      }

      let candidatePositions = [];

      candidatePositions = await candidatePositionFinder(candidate.id);

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
  return await CandidatePosition.find({ candidate: id })
    .sort([{ order: 'ASC' }])
    .populate('topIssue')
    .populate('position');
}
