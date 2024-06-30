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
        ballotCandidate: { '!=': null },
        isActive: true,
        user: { '!=': null },
      }).populate('user');

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        try {
          const { firstName, lastName } = campaign.user;
          const state = campaign.details?.state;

          const candidate = await BallotCandidate.find({
            firstName,
            lastName,
            state,
          });
          if (candidate.length === 0) {
            console.log('No candidate found for', campaign.slug);
            stats.notFound++;
            continue;
          }
          if (candidate.length === 1) {
            await Campaign.updateOne({ id: campaign.id }).set({
              ballotCandidate: candidate[0].id,
            });
            await BallotCandidate.updateOne({ id: candidate[0].id }).set({
              campaign: campaign.id,
            });
            stats.nameStateMatch++;
          }
          if (candidate.length > 1) {
            const raceId = campaign.details?.raceId;
            const raceCandidates = candidate.filter((c) => c.raceId === raceId);
            if (raceCandidates.length === 1) {
              await Campaign.updateOne({ id: campaign.id }).set({
                ballotCandidate: raceCandidates[0].id,
              });
              await BallotCandidate.updateOne({
                id: raceCandidates[0].id,
              }).set({
                campaign: campaign.id,
              });
            }
            stats.raceIdMatch++;
          }
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
