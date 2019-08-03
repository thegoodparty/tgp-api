const request = require('request-promise');
module.exports = {
  friendlyName: 'User Elections',

  description:
    "query google civic api for the user's address related elections.",

  inputs: {},

  exits: {
    success: {
      description: 'Elections searched successfully',
    },

    badRequest: {
      description: 'Error searching address',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const user = this.req.user;
      console.log(user);
      const address = user.address;
      if (!address) {
        return exits.badRequest({
          message: 'User address must be set first.',
        });
      }

      const electionsResponse = await civicApiElections(address);
      const election = electionsResponse.election;

      console.log(electionsResponse);
      if (election && election !== {}) {
        const districtCode = electionsResponse.contests
          ? electionsResponse.contests[0].district.id
          : -1;
        console.log('districtCode', districtCode)
        const district = await District.findOne({
          code: districtCode,
        });

        // find or create Election based on the election id
        const electionRecord = await Election.findOrCreate(
          { civicId: election.id },
          {
            civicId: election.id,
            name: election.name,
            electionDay: election.electionDay,
            ocdDivisionId: election.ocdDivisionId,
            rawResult: JSON.stringify(electionsResponse),
            district: district.id,
          },
        ).fetch();

        return exits.success({
          message: 'Elections searched successfully',
          electionsResponse,
          electionRecord
        });
      }
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error saving address',
      });
    }
  },
};

const civicApiElections = async address => {
  try {
    const googleApiKey =
      sails.config.custom.googleApiKey || sails.config.googleApiKey;
    const options = {
      uri: `https://www.googleapis.com/civicinfo/v2/voterinfo?key=${googleApiKey}&address=${encodeURI(
        address.replace(/,/g, ''),
      )}&officialOnly=true`,
      json: true,
    };

    const civicResponse = await request(options);
    return civicResponse;
  } catch (err) {
    console.log(err);
  }
};

//301 Studdard Dr, Clanton, AL 35045
