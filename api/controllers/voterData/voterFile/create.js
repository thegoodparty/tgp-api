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
      console.log('starting voterFiler/create');

      const { slug } = inputs;
      await sails.helpers.slack.errorLoggerHelper(
        'Purchasing voter file.',
        slug,
      );
      const campaign = await Campaign.findOne({ slug });
      const { data } = campaign;

      if (
        !data.pathToVictory?.electionType ||
        !data.pathToVictory?.electionLocation ||
        data.hasVoterFile
      ) {
        await sails.helpers.slack.errorLoggerHelper(
          'Purchasing voter file error: Path to Victory is not set',
          slug,
        );
        return exits.badRequest({ message: 'Path to Victory is not set.' });
      }

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
        data.details.state,
        data.pathToVictory.electionType,
        data.pathToVictory.electionLocation,
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
