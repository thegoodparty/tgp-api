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
      let campaign = await Campaign.findOne({
        slug,
        isActive: true,
      });

      if (!campaign) {
        return exits.notFound();
      }
      let campaignData = campaign.data;
      if (!campaignData) {
        return exits.notFound();
      }

      let reportedVoterGoals;
      let candidatePositions = [];

      if (allFields) {
        candidatePositions = await candidatePositionFinder(campaign.id);
        reportedVoterGoals = campaignData.reportedVoterGoals;
      }

      return exits.success({
        candidate: mapCampaignToCandidate(campaignData),
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
  return await CandidatePosition.find({ campaign: id })
    .sort([{ order: 'ASC' }])
    .populate('topIssue')
    .populate('position');
}

function mapCampaignToCandidate(campaign) {
  const {
    slug,
    details,
    goals,
    campaignPlan,
    pathToVictory,
    color,
    image,
    twitter,
    instagram,
    facebook,
    linkedin,
    tiktok,
    snap,
    twitch,
    hashtag,
    website,
    customIssues,
    endorsements,
  } = campaign;

  const {
    firstName,
    lastName,
    party,
    otherParty,
    state,
    office,
    otherOffice,
    pastExperience,
    occupation,
    funFact,
    district,
    city,
  } = details;
  const { slogan, aboutMe, why } = campaignPlan || {};

  const { electionDate, campaignWebsite } = goals || {};

  const partyWithOther = party === 'Other' ? otherParty : party;

  let voteGoal;
  let voterProjection;
  if (pathToVictory) {
    ({ voteGoal, voterProjection } = pathToVictory);
  }
  return {
    // campaignOnboardingSlug: slug,
    slug,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    party: partyWithOther,
    district,
    state,
    city,
    office,
    otherOffice,
    slogan,
    about: aboutMe,
    why,
    pastExperience,
    occupation,
    funFact,
    voteGoal: parseInt(voteGoal) || 0,
    voterProjection: parseInt(voterProjection) || 0,
    color,
    image,
    twitter,
    instagram,
    facebook,
    linkedin,
    tiktok,
    snap,
    twitch,
    hashtag,
    website: campaignWebsite || website,
    isActive: true,
    electionDate,
    customIssues,
    endorsements,
  };
}
