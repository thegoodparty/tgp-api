/* eslint-disable object-shorthand */
const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    level: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
    county: {
      type: 'string',
    },
    municipality: {
      type: 'string',
    },
    isJudicial: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Office Helper Test',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { level, state, county, municipality, isJudicial } = inputs;

      let searchParams = {
        level: level ? level : 'federal',
        state: state ? state : undefined,
        county: county ? county : undefined,
        municipality: municipality ? municipality : undefined,
        isJudicial: isJudicial ? isJudicial : false,
      };
      let racesQuery = await BallotRace.find({
        where: searchParams,
        select: ['id'],
      }).limit(1000);
      let ids = [];
      for (const race of racesQuery) {
        ids.push(race.id);
      }

      console.log('# races', ids.length);
      let rnd = Math.floor(Math.random() * ids.length) + 1;
      let randomId = ids[rnd];
      console.log('randomId', randomId);

      let race = await BallotRace.findOne({ id: randomId })
        .populate('municipality')
        .populate('county');

      console.log('race', race);
      console.log(`processing ${race.data.position_name}`);

      const officeResponse = await sails.helpers.campaign.officeHelper(
        race.data.position_name,
        race.level,
        race.state,
        race.county ? race.county.name : undefined,
        race.municipality ? race.municipality.name : undefined,
        race.subAreaName ? race.subAreaName : undefined,
        race.subAreaValue ? race.subAreaValue : undefined,
      );

      console.log('officeResponse', officeResponse);

      return exits.success('ok');
    } catch (e) {
      console.log('error getting campaign', e);
      return exits.success(false);
    }
  },
};
