const slugify = require('slugify');
const moment = require('moment');

module.exports = {
  inputs: {
    state: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 2,
    },
    city: {
      type: 'string',
      required: true,
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
      const { city } = inputs;
      const inputState = inputs.state;
      const state = inputState.toUpperCase();

      let messages = [
        {
          role: 'system',
          content:
            'You help me find close cities, and respond in javascript json format.',
        },
        {
          role: 'user',
          content: `Given a city and state in the format "City, State", identify the two closest cities (excluding the provided city) to the specified location. Return the names of these two closest cities in a JSON array format, with each entry containing only the city name. Please ensure the response contains only the names of the two closest cities, without including their states or any additional text, in the specified JSON array format. The input city is ${city} in ${state} state. For example, if the input is "Springfield, Illinois", a correct output would be in the following format: ["CityName1", "CityName2"]. Don't add backticks or the string "json" before. just return the array as a string so I can perform JSON.parse() on the response
          The input city is ${city} in ${state} state.`,
        },
      ];

      const completion = await sails.helpers.ai.createCompletion(messages);

      const cities = completion.content;
      const parsed = JSON.parse(cities);

      const municipalityRecord1 = await Municipality.findOne({
        where: {
          name: city,
          state,
        },
        select: ['id', 'slug', 'name'],
      });

      if (municipalityRecord1) {
        const racesCount = await BallotRace.count({
          municipality: municipalityRecord1.id,
        });
        municipalityRecord1.openElections = racesCount;
        municipalityRecord1.state = state;
      }

      let municipalityRecord2;
      let municipalityRecord3;

      if (parsed.length > 0) {
        municipalityRecord2 = await Municipality.findOne({
          where: {
            name: parsed[0],
            state,
          },
          select: ['id', 'slug', 'name'],
        });
        if (municipalityRecord2) {
          const racesCount = await BallotRace.count({
            municipality: municipalityRecord2.id,
          });
          municipalityRecord2.openElections = racesCount;
          municipalityRecord2.state = state;
        }
      }
      if (parsed.length > 1) {
        municipalityRecord3 = await Municipality.findOne({
          where: {
            name: parsed[1],
            state,
          },
          select: ['id', 'slug', 'name'],
        });
        if (municipalityRecord3) {
          const racesCount = await BallotRace.count({
            municipality: municipalityRecord3.id,
          });
          municipalityRecord3.openElections = racesCount;
          municipalityRecord3.state = state;
        }
      }

      if (
        !municipalityRecord1 &&
        !municipalityRecord2 &&
        !municipalityRecord3
      ) {
        return exits.success({ cities: [] });
      }

      return exits.success({
        cities: [municipalityRecord1, municipalityRecord2, municipalityRecord3],
        parsed,
      });
    } catch (e) {
      console.log('error at races/proximity-cities', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
