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
      const campaign = await Campaign.findOne({ slug });
      const { data } = campaign;

      if (
        !data.pathToVictory?.electionType ||
        !data.pathToVictory?.electionLocation ||
        data.hasVoterFile
      ) {
        return exits.badRequest({ message: 'Path to Victory is not set.' });
      }

      const filters = {
        Parties_Description: [
          'Conservative',
          'American Independent',
          'Constitution',
          'Non-Partisan',
          'Green',
          'Other',
          'Natural Law',
          'Socialist',
          'Libertarian',
          'Working Family Party',
          'Prohibition',
          'Rainbow',
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
      return exits.badRequest({ message: 'Error registering candidate.' });
    }
  },
};
