// connect campaigns and candidates
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    const stats = {
      notFound: 0,
      nameStateMatch: 0,
      raceIdMatch: 0,
    };
    try {
      const campaigns = await Campaign.find({
        select: ['id', 'slug'],
        where: {
          ballotCandidate: null,
          isActive: true,
          user: { '!=': null },
        },
      });

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        try {
          await sails.helpers.campaign.linkCandidateCampaign(campaign.id);
        } catch (e) {
          console.log('Error in seed campaign', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error at seed with campaign ${campaign.slug}`,
            e,
          );
        }
      }
      await sails.helpers.slack.errorLoggerHelper(
        `matched campaign with candidates.`,
        { stats },
      );
      return exits.success({
        message: 'matched campaign with candidates.',
        stats,
      });
    } catch (e) {
      console.log('Error in seed', e);
      await sails.helpers.slack.errorLoggerHelper('Error at seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
        stats,
      });
    }
  },
};
