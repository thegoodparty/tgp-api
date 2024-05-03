module.exports = {
  inputs: {
    slug: {
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
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { slug } = inputs;
      const campaign = await Campaign.findOne({ slug }).populate(
        'pathToVictory',
      );
      const { data, details, pathToVictory } = campaign;

      if (
        !pathToVictory?.data?.electionType ||
        !pathToVictory?.data?.electionLocation ||
        data.hasVoterFile
      ) {
        console.log('Path to Victory is not set.', campaign);
        return exits.badRequest({ message: 'Path to Victory is not set.' });
      }
      await Campaign.updateOne({ id: campaign.id }).set({
        data: { ...campaign.data, hasVoterFile: 'processing' },
      });

      const filters = {
        Parties_Description: [
          'American Independent',
          'Non-Partisan',
          'Green',
          'Other',
          'Peace and Freedom',
          'Natural Law',
          'Libertarian',
          'Reform',
        ],
      };

      await sails.helpers.campaign.voterDataHelper(
        campaign.id,
        details.state,
        pathToVictory.data.electionType,
        pathToVictory.data.electionLocation,
        filters,
        false,
      );

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error purchasing voter file.',
        e,
      );
      return exits.badRequest({ message: 'Error purchasing voter file.' });
    }
  },
};
