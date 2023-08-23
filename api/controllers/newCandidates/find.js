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

      let reportedVoterGoals;
      let candidatePositions = [];

      if (allFields) {
        candidatePositions = await candidatePositionFinder(candidate.id);
        if (candidateData.campaignOnboardingSlug) {
          const campaign = await Campaign.findOne({
            slug: candidateData.campaignOnboardingSlug,
          });
          reportedVoterGoals = campaign?.data?.reportedVoterGoals;
        }
      }

      return exits.success({
        candidate: candidateData,
        candidatePositions,
        reportedVoterGoals,
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
