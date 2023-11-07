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
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { candidate } = inputs;
      const { user } = this.req;

      const {
        slug,
        firstName,
        lastName,
        party,
        district,
        state,
        city,
        office,
        otherOffice,
        slogan,
        about,
        why,
        pastExperience,
        occupation,
        funFact,
        voteGoal,
        voterProjection,
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
        electionDate,
        endorsements,
      } = candidate;

      let campaign = await Campaign.findOne({
        slug,
        isActive: true,
      });

      if (!campaign) {
        return exits.notFound();
      }

      const canAccess = await sails.helpers.staff.canAccess(campaign, user);
      if (!canAccess) {
        return exits.forbidden();
      }

      let campaignData = campaign.data;
      if (!campaignData) {
        return exits.notFound();
      }

      campaignData.campaignPlan = campaignData.campaignPlan || {};
      campaignData.pathToVictory = campaignData.pathToVictory || {};
      const updatedData = {
        ...campaignData,
        endorsements,
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
        details: {
          ...campaignData.details,
          firstName,
          lastName,
          party,
          state,
          office,
          otherOffice,
          pastExperience,
          occupation,
          funFact,
          district,
          city,
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
        },
        campaignPlan: {
          ...campaignData.campaignPlan,
          slogan,
          aboutMe: about,
          why,
        },
        goals: {
          ...campaignData.goals,
          electionDate,
          campaignWebsite: website,
        },
        pathToVictory: {
          ...campaignData.pathToVictory,
          voteGoal,
          voterProjection,
        },
      };

      await Campaign.updateOne({ slug }).set({ data: updatedData });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('Error in update candidate', e);
      return exits.notFound();
    }
  },
};
