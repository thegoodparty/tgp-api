module.exports = {
  inputs: {
    campaignId: {
      type: 'number',
    },
  },

  exits: {
    success: {
      outputDescription: 'Campaign Found',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { campaignId } = inputs;

      const campaign = await Campaign.find({
        id: campaignId,
        user: { '!=': null },
      }).populate('user');

      const { firstName, lastName } = campaign.user || {};
      const state = campaign.details?.state;

      if (!firstName || !lastName || !state) {
        return exits.success('No match found');
      }

      const candidates = await BallotCandidate.find({
        firstName,
        lastName,
        state,
      });
      if (candidates.length === 0) {
        console.log('No candidate found for', campaign.slug);
        return exits.success('No candidate found');
      }
      if (candidates.length === 1) {
        await Campaign.updateOne({ id: campaign.id }).set({
          ballotCandidate: candidates[0].id,
        });
        await BallotCandidate.updateOne({ id: candidates[0].id }).set({
          campaign: campaign.id,
        });
        return exits.success('Match found!');
      }
      if (candidates.length > 1) {
        const raceId = campaign.details?.raceId;
        const raceCandidates = candidates.filter((c) => c.raceId === raceId);
        if (raceCandidates.length === 1) {
          await Campaign.updateOne({ id: campaign.id }).set({
            ballotCandidate: raceCandidates[0].id,
          });
          await BallotCandidate.updateOne({
            id: raceCandidates[0].id,
          }).set({
            campaign: campaign.id,
          });
          return exits.success('Match found!');
        }
      }
      return exits.success('No match found');
    } catch (e) {
      console.log('Error in link candidate-campaign helper', e);
      await sails.helpers.slack.errorLoggerHelper(
        `Error at link candidate-campaign helper with campaign ${inputs.campaignId}`,
        e,
      );
      return exits.success('No match found - error');
    }
  },
};
