module.exports = {
  inputs: {
    campaignId: {
      type: 'string',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { campaignId } = inputs;
    try {
      let campaign = await Campaign.findOne({ id: campaignId }).populate(
        'pathToVictory',
      );
      let electionTypeRequired = true;
      if (
        campaign.details.ballotLevel &&
        campaign.details.ballotLevel !== 'FEDERAL' &&
        campaign.details.ballotLevel !== 'STATE'
      ) {
        // not required for state/federal races
        // so we can fall back to the whole state.
        electionTypeRequired = false;
      }
      if (
        electionTypeRequired &&
        (!campaign.pathToVictory?.data?.electionType ||
          !campaign.pathToVictory?.data?.electionLocation)
      ) {
        console.log('Campaign is not eligible for download.', campaignId);
        return exits.success(false);
      } else {
        return exits.success(true);
      }
    } catch (e) {
      console.log('error at can-download-voter-file', e);
      return exits.success({ message: 'ok' });
    }
  },
};
