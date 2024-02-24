const slugify = require('slugify');
const moment = require('moment');

module.exports = {
  inputs: {
    state: {
      type: 'string',
    },
    county: {
      type: 'string',
    },
    city: {
      type: 'string',
    },
    positionSlug: {
      type: 'string',
    },
    id: {
      type: 'string', // old for redirects
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
      const { state, county, city, positionSlug, id } = inputs;
      if (id) {
        const race = await BallotRace.findOne({
          where: { hashId: id },
          select: ['positionSlug', 'data'],
        })
          .populate('municipality')
          .populate('county');
        race.state = race.data.state;
        delete race.data;
        return exits.success({ race });
      }
      let countyRecord;
      let cityRecord;
      if (county) {
        const slug = `${slugify(state, { lower: true })}/${slugify(county, {
          lower: true,
        })}`;
        countyRecord = await County.findOne({ slug });
      }
      if (city && countyRecord) {
        const slug = `${slugify(state, { lower: true })}/${slugify(county, {
          lower: true,
        })}/${slugify(city, {
          lower: true,
        })}`;
        cityRecord = await Municipality.findOne({
          slug,
        });
      }
      const nextYear = moment()
        .startOf('year')
        .add(1, 'year')
        .format('M D, YYYY');

      const query = {
        state: state.toUpperCase(),
        positionSlug,
        electionDate: { '<': new Date(nextYear) },
      };
      if (city && cityRecord) {
        query.municipality = cityRecord.id;
      } else if (countyRecord) {
        query.county = countyRecord.id;
      }
      const races = await BallotRace.find(query).sort('electionDate ASC');
      const race = races[0];
      let positions = [];
      for (let i = 0; i < races.length; i++) {
        positions.push(races[i].data.position_name);
      }

      race.municipality = cityRecord;
      race.county = countyRecord;
      // .populate('municipality')
      // .populate('county');

      const { name, level } = await sails.helpers.ballotready.extractLocation(
        race.data,
      );

      let otherRaces = [];
      if (race.municipality) {
        otherRaces = await BallotRace.find({
          where: { municipality: race.municipality.id },
          select: ['data', 'hashId', 'positionSlug'],
        });
      } else if (race.county) {
        otherRaces = await BallotRace.find({
          where: { county: race.county.id },
          select: ['data', 'hashId', 'positionSlug'],
        });
      }
      const dedups = {};
      otherRaces = otherRaces.map((OtherRace) => {
        if (!dedups[OtherRace.positionSlug]) {
          dedups[OtherRace.positionSlug] = true;
          return {
            name: OtherRace.data.normalized_position_name,
            slug: OtherRace.positionSlug,
          };
        }
      });

      const {
        election_name,
        position_name,
        election_day,
        // state,
        partisan_type,
        salary,
        employment_type,
        filing_date_start,
        filing_date_end,
        normalized_position_name,
        position_description,
        frequency,
        filing_office_address,
        filing_phone_number,
        paperwork_instructions,
        filing_requirements,
        eligibility_requirements,
        is_runoff,
        is_primary,
      } = race.data;

      const filtered = {
        hashId: race.hashId,
        positionName: position_name,
        locationName: name,
        electionDate: election_day,
        electionName: election_name,
        state,
        level,
        partisanType: partisan_type,
        salary,
        employmentType: employment_type,
        filingDateStart: filing_date_start,
        filingDateEnd: filing_date_end,
        normalizedPositionName: normalized_position_name,
        positionDescription: position_description,
        frequency,
        subAreaName: race.subAreaName,
        subAreaValue: race.subAreaValue,
        filingOfficeAddress: filing_office_address,
        filingPhoneNumber: filing_phone_number,
        paperworkInstructions: paperwork_instructions,
        filingRequirements: filing_requirements,
        eligibilityRequirements: eligibility_requirements,
        isRunoff: is_runoff,
        isPriamry: is_primary,
        municipality: race.municipality
          ? { name: race.municipality.name, slug: race.municipality.slug }
          : null,
        county: race.county
          ? { name: race.county.name, slug: race.county.slug }
          : null,
      };

      return exits.success({
        race: filtered,
        otherRaces,
        positions,
      });
    } catch (e) {
      console.log('error at races/by-city', e);
      return exits.badRequest({
        error: true,
        e,
      });
    }
  },
};
