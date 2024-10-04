const { findSlug } = require('../../utils/campaign/findSlug');
const { createCrmUser } = require('../../utils/campaign/createCrmUser');
const { dateToISO8601DateString } = require('../../utils/dates');
const {
  sendCampaignLaunchEmail,
} = require('../../utils/campaign/event-handlers/sendCampaignLaunchEmail');

const get8WeeksFutureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7 * 8);
  return date;
};

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Campaign Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'creation failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;
      const { demoPersona } = JSON.parse(user.metaData || '{}');
      const userName = await sails.helpers.user.name(user);
      if (userName === '') {
        return exits.badRequest('No user name');
      }

      const demoCampaign = await Campaign.findOne({
        slug: demoPersona,
      })
        .populate('user')
        .populate('pathToVictory');
      const {
        user: demoUser,
        pathToVictory: demoP2V,
        id: demoCampaignId,
      } = demoCampaign;

      await User.updateOne({ id: user.id }).set({
        avatar: demoUser.avatar,
      });

      delete demoCampaign.id;
      delete demoCampaign.pathToVictory;

      let campaign = await sails.helpers.campaign.byUser(user.id);

      if (!campaign) {
        const slug = await findSlug(userName, 'demo');
        campaign = await Campaign.create({
          ...demoCampaign,
          slug,
          data: {
            ...demoCampaign.data,
            slug,
          },
          isDemo: true,
          user: user.id,
          details: {
            ...demoCampaign.details,
            electionDate: dateToISO8601DateString(get8WeeksFutureDate()),
          },
        }).fetch();
      }
      const { slug } = campaign;

      const candidatePositions = await CandidatePosition.find({
        campaign: demoCampaignId,
      });

      for (let i = 0; i < candidatePositions.length; i++) {
        const { description, position, topIssue, order } =
          candidatePositions[i];
        await CandidatePosition.create({
          description,
          campaign: campaign.id,
          position,
          topIssue,
          order,
        });
      }

      await createCrmUser(user.firstName, user.lastName, user.email);

      const p2v = await PathToVictory.create({
        campaign: campaign.id,
        data: demoP2V.data,
      }).fetch();

      await Campaign.updateOne({ id: campaign.id }).set({
        pathToVictory: p2v.id,
      });

      await sails.helpers.campaign.linkCandidateCampaign(campaign.id);
      await sails.helpers.crm.updateCampaign(campaign);
      await sails.helpers.fullstory.customAttr(user.id);

      await sendCampaignLaunchEmail(slug);

      return exits.success({
        slug,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error creating campaign.', e });
    }
  },
};
