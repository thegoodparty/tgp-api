const moment = require('moment');
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
        select: ['name', 'slug'],
      });

      const cities = await Municipality.find({
        where: { state },
        select: ['name', 'slug'],
      });

      const nextYear = moment()
        .startOf('year')
        .add(1, 'year')
        .format('M D, YYYY');

      const stateRaces = await BallotRace.find({
        where: {
          state,
          level: 'state',
          county: null,
          municipality: null,
          electionDate: { '<': new Date(nextYear) },
        },
        select: ['positionSlug'],
      });

      // Deduplicate based on positionSlug
      const uniqueStateRaces = new Map();

      stateRaces.forEach((race) => {
        if (!uniqueStateRaces.has(race.positionSlug)) {
          const { positionSlug } = race;
          let stateRace = {};
          stateRace.positionSlug = positionSlug;
          stateRace.level = 'state';
          stateRace.slug = `${inputState.toLowerCase()}/${positionSlug}`;
          uniqueStateRaces.set(race.positionSlug, stateRace);
        }
      });
      // Convert the Map values back to an array for the final deduplicated list
      const dedupStateRaces = Array.from(uniqueStateRaces.values());

      const countyRaces = await BallotRace.find({
        where: {
          state,
          level: 'county',
          county: { '!=': null },
          municipality: null,
          electionDate: { '<': new Date(nextYear) },
        },
        select: ['positionSlug'],
      }).populate('county');

      // Deduplicate based on positionSlug
      const uniqueCountyRaces = new Map();

      countyRaces.forEach((race) => {
        if (!uniqueStateRaces.has(race.positionSlug)) {
          const { positionSlug, county } = race;
          let countyRace = {};
          countyRace.positionSlug = positionSlug;
          countyRace.level = 'county';
          countyRace.slug = `${county.slug}/${positionSlug}`;
          uniqueCountyRaces.set(race.positionSlug, countyRace);
        }
      });
      // Convert the Map values back to an array for the final deduplicated list
      const dedupCountyRaces = Array.from(uniqueCountyRaces.values());

      // city
      const cityRaces = await BallotRace.find({
        where: {
          state,
          county: null,
          municipality: { '!=': null },
          electionDate: { '<': new Date(nextYear) },
        },
        select: ['positionSlug'],
      }).populate('municipality');

      // Deduplicate based on positionSlug
      const uniqueCityRaces = new Map();

      cityRaces.forEach((race) => {
        if (!uniqueStateRaces.has(race.positionSlug)) {
          const { positionSlug, municipality } = race;
          let cityRace = {};
          cityRace.positionSlug = positionSlug;
          cityRace.level = 'county';
          cityRace.slug = `${municipality.slug}/${positionSlug}`;
          uniqueCityRaces.set(race.positionSlug, cityRace);
        }
      });
      // Convert the Map values back to an array for the final deduplicated list
      const dedupCityRaces = Array.from(uniqueCityRaces.values());

      return exits.success({
        counties,
        cities,
        stateRaces: dedupStateRaces,
        countyRaces: dedupCountyRaces,
        cityRaces: dedupCityRaces,
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
