const slugify = require('slugify');

module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
      minLength: 5,
      maxLength: 10,
    },
  },

  exits: {
    success: {
      description: 'found',
    },

    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },

    notFound: {
      description: 'Not Found',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { id } = inputs;
      const race = await BallotRace.findOne({ hashId: id })
        .populate('municipality')
        .populate('county');

      return exits.success({
        race,
      });
    } catch (e) {
      console.log('error at races/by-city', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
