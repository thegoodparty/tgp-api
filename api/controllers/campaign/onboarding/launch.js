/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Campaigns.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const { create } = require('lodash');
const slugify = require('slugify');

module.exports = {
  friendlyName: 'Find Campaign associated with user',

  inputs: {},

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }

      if (!campaign) {
        console.log('no campaign');
        return exits.forbidden();
      }
      if (campaign.launched) {
        return exits.success({
          slug: campaign.candidateSlug || campaign.slug,
        });
      }

      const candidate = mapCampaignToCandidate(campaign);
      const { firstName, lastName, state } = candidate;
      const slug = await findSlug(candidate);
      candidate.slug = slug;
      const dbFields = {
        slug,
        firstName,
        lastName,
        isActive: true,
        state,
        contact: {},
        data: JSON.stringify(candidate),
      };

      const created = await Candidate.create(dbFields).fetch();
      await Candidate.updateOne({
        id: created.id,
      }).set({
        data: JSON.stringify({
          ...candidate,
          id: created.id,
        }),
      });

      await Campaign.updateOne({ slug: campaign.slug }).set({
        data: {
          ...campaign,
          launched: true,
          candidateSlug: slug,
        },
      });

      // console.log('cand', created);
      const { topIssues } = campaign.details;
      // topIssues;

      await createCandidatePositions(topIssues, created);

      await sails.helpers.crm.updateCandidate(candidate);
      await sails.helpers.cacheHelper('clear', 'all');

      return exits.success({
        message: 'created',
        slug,
      });
    } catch (e) {
      console.log('Error at campaign launch', e);
      await sails.helpers.errorLoggerHelper('Error at campaign launch', e);
      return exits.forbidden();
    }
  },
};

function mapCampaignToCandidate(campaign) {
  if (!campaign) {
    return false;
  }
  const {
    slug,
    details,
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
  } = campaign;
  const {
    firstName,
    lastName,
    party,
    state,
    office,
    pastExperience,
    occupation,
    funFact,
  } = details;
  const { slogan, aboutMe, why } = campaignPlan;

  let voteGoal;
  let voterProjection;
  if (pathToVictory) {
    ({ voteGoal, voterProjection } = pathToVictory);
  }
  return {
    campaignOnboardingSlug: slug,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    party,
    state,
    office,
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
    website,
    isActive: true,
  };
}

async function findSlug(candidate) {
  // trying first to use campaign slug
  const campaignExists = await Candidate.findOne({
    slug: candidate.campaignOnboardingSlug,
  });
  if (!campaignExists) {
    return candidate.campaignOnboardingSlug;
  }
  const { firstName, lastName } = candidate;
  const slug = slugify(`${firstName}-${lastName}`, { lower: true });
  const exists = await Candidate.findOne({ slug });
  if (!exists) {
    return slug;
  }
  for (let i = 1; i < 100; i++) {
    let slug = slugify(`${firstName}-${lastName}${i}`, { lower: true });
    let exists = await Candidate.findOne({ slug });
    if (!exists) {
      return slug;
    }
  }
  return slug; // should not happen
}

async function createCandidatePositions(topIssues, candidate) {
  for (let i = 0; i < topIssues.positions.length; i++) {
    const position = topIssues.positions[i];

    if (position.id !== 'custom-id') {
      await CandidatePosition.create({
        description: topIssues[`position-${position.id}`],
        candidate: candidate.id,
        position: position.id,
        topIssue: position.topIssue.id,
        order: i,
      });
      await Candidate.addToCollection(candidate.id, 'positions', position.id);
      await Candidate.addToCollection(
        candidate.id,
        'topIssues',
        position.topIssue.id,
      );
    } else {
      const data = JSON.parse(candidate.data);

      const newIssue = {
        description: topIssues[`position-${position.id}`],
      };
      if (!data.customIssues) {
        data.customIssues = [];
      }

      data.customIssues.push(newIssue);

      await Candidate.updateOne({
        id: candidate.id,
      }).set({
        data: JSON.stringify(data),
      });
    }
  }
}
