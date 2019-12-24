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
      description: 'Error searching for elections',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const user = this.req.user;
      const address = user.address;
      if (!address) {
        return exits.badRequest({
          message: 'User address must be set first.',
        });
      }

      const electionsResponse = await civicApiElections(address);
      const election = electionsResponse ? electionsResponse.election : false;

      if (
        election &&
        election !== {} &&
        electionsResponse.contests &&
        electionsResponse.contests.length > 0
      ) {
        const districtCode = electionsResponse.contests[0].district.id;
        // house (stateLower) Senate (stateUpper) or congressional
        const districtScope = electionsResponse.contests[0].district.scope;
        let district;
        let type;
        if (districtScope === 'congressional') {
          district = await CongDistrict.findOne({
            code: districtCode,
          });
          type = 'congDistrict';
        } else if (districtScope === 'stateLower') {
          district = await HouseDistrict.findOne({
            code: districtCode,
          });
          type = 'houseDistrict';
        } else if (districtScope === 'stateUpper') {
          district = await SenateDistrict.findOne({
            code: districtCode,
          });
          type = 'senateDistrict';
        }

        // find or create Election based on the election id
        const electionRecord = await Election.findOrCreate(
          { civicId: election.id },
          {
            civicId: election.id,
            name: election.name,
            electionDay: election.electionDay,
            ocdDivisionId: election.ocdDivisionId,
            rawResult: JSON.stringify(electionsResponse),
            [type]: district.id,
          },
        );

        const fullElectionRecord = await Election.findOne({
          id: electionRecord.id,
        })
          .populate('congDistrict')
          // .populate('houseDistrict')
          // .populate('senateDistrict');

        return exits.success({
          message: 'Elections searched successfully',
          fullElections: electionsResponse,
          electionSummary: fullElectionRecord,
        });
      } else {
        return exits.success({
          message: 'No Elections found for your address',
        });
      }
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error loading elections',
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
    console.log(civicResponse);
    return civicResponse;
  } catch (err) {
    console.log(err);
    return false;
  }
};

//301 Studdard Dr, Clanton, AL 35045
