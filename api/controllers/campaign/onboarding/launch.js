// Admin endpoint

const { create } = require('lodash');
const slugify = require('slugify');
const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  friendlyName: 'Admin launch Campaign',

  inputs: {
    slug: {
      type: 'string',
    },
  },

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
      const inputSlug = inputs.slug;
      const { user } = this.req;
      // permissions - admin can launch by slug, but we also allow shortVersion campaign to launch without admin permissions.
      if (inputSlug && !user.isAdmin) {
        return exits.forbidden();
      }
      let campaignRecord;
      if (inputSlug) {
        campaignRecord = await Campaign.findOne({
          slug: inputSlug,
        });
      } else {
        campaignRecord = await sails.helpers.campaign.byUser(user);
      }

      if (!campaignRecord) {
        console.log('no campaign');
        return exits.forbidden();
      }

      const campaign = campaignRecord.data;

      if (campaignRecord.isActive || campaign.launchStatus === 'launched') {
        return exits.success({
          slug: campaign.candidateSlug || campaign.slug,
        });
      }

      const updated = await Campaign.updateOne({ slug: campaign.slug }).set({
        isActive: true,
        data: {
          ...campaign,
          launchStatus: 'launched',
          candidateSlug: slug,
        },
      });

      // console.log('cand', created);
      const { topIssues } = campaign.details;
      // topIssues;

      await createCandidatePositions(topIssues, created);

      // await sails.helpers.crm.updateCandidate(created);
      await sails.helpers.crm.updateCampaign(updated);

      await sendMail(slug);

      return exits.success({
        message: 'created',
        slug,
      });
    } catch (e) {
      console.log('Error at campaign launch', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at campaign launch',
        e,
      );
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
    campaignOnboardingSlug: slug,
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
  if (!topIssues?.positions || !candidate.id) {
    return;
  }
  for (let i = 0; i < topIssues.positions.length; i++) {
    const position = topIssues.positions[i];

    if (!position || !position.topIssue) {
      continue;
    }
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
  }
}

//campagin-launch

async function sendMail(slug) {
  try {
    const campaign = await Campaign.findOne({ slug }).populate('user');
    const { user } = campaign;
    const variables = JSON.stringify({
      name: `${user.name}`,
      link: `${appBase}/${slug}`,
    });
    await sails.helpers.mailgun.mailgunTemplateSender(
      user.email,
      'Your Good Party Campaign is live!',
      'campagin-launch',
      variables,
    );
  } catch (e) {
    console.log(e);
  }
}
