module.exports = {
  inputs: {
    state: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 2,
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
  },

  fn: async function (inputs, exits) {
    try {
      const inputState = inputs.state;
      const state = inputState.toUpperCase();
      const counties = await County.find({
        where: { state },
        select: ['name'],
      });
      const races = await BallotRace.find({
        state,
        level: 'state',
        county: null,
        municipality: null,
      });
      return exits.success({
        counties,
        races,
      });
    } catch (e) {
      console.log('error at races/by-state', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
