module.exports = {
  friendlyName: 'User Pledges',

  description: "Active pledges and threshold per user's address",

  inputs: {},

  exits: {
    success: {
      description: 'Pledges found',
    },

    badRequest: {
      description: 'Error searching pledges',
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
      // get user cd and senate districts
      const cd = await CongressionalDistrict.findOne({
        id: user.congressionalDistrict,
      });

      const senate = await SenateDistrict.findOne({
        id: user.senateDistrict,
      });
      let totalCdPledges = 0;
      if (user.congressionalDistrict) {
        totalCdPledges = await User.count({
          congressionalDistrict: user.congressionalDistrict,
        });
      }

      let totalSenatePledges = 0;
      if (user.senateDistrict) {
        totalSenatePledges = await User.count({
          senateDistrict: user.senateDistrict,
        });
      }

      return exits.success({
        cd,
        senate,
        totalCdPledges,
        totalSenatePledges,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error loading pledges',
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
