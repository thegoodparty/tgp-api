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
      const { name, level } = await sails.helpers.ballotready.extractLocation(
        race.data,
      );

      let otherRaces = [];
      if (race.municipality) {
        otherRaces = await BallotRace.find({
          where: { municipality: race.municipality.id },
          select: ['data', 'hashId'],
        });
      } else if (race.county) {
        otherRaces = await BallotRace.find({
          where: { county: race.county.id },
          select: ['data', 'hashId'],
        });
      }
      otherRaces = otherRaces.map((race) => {
        return {
          name: race.data.position_name,
          hashId: race.hashId,
        };
      });

      const {
        election_name,
        position_name,
        election_day,
        state,
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
        id,
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
