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
    allFields: {
      type: 'boolean',
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
      const { slug, allFields } = inputs;
      let candidate = await Candidate.findOne({
        slug,
        isActive: true,
      });

      if (!candidate) {
        return exits.notFound();
      }
      let candidateData = JSON.parse(candidate.data);

      let candidatePositions = [];

      let support;

      if (allFields) {
        candidatePositions = await candidatePositionFinder(candidate.id);
        support = await sails.helpers.support.supportByCandidate(candidate.id);
      }

      return exits.success({
        candidate: candidateData,
        candidatePositions,
        support,
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
