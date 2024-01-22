module.exports = {
  inputs: {
    state: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 2,
    },
    viewAll: {
      type: 'boolean',
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
      const { viewAll } = inputs;
      const state = inputState.toUpperCase();
      const counties = await County.find({
        where: { state },
        select: ['name', 'slug'],
      });
      const races = await BallotRace.find({
        where: { state, level: 'state', county: null, municipality: null },
        select: ['hashId', 'data'],
        limit: viewAll ? undefined : 10,
      });
      console.log('races', races.length);
      races.forEach((race) => {
        const { data } = race;
        const {
          election_name,
          election_day,
          position_name,
          position_description,
          level,
        } = data;
        race.electionName = election_name;
        race.date = election_day;
        race.positionName = position_name;
        race.positionDescription = position_description;
        race.level = level;
        delete race.data;
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
