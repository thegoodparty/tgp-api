const request = require('request-promise');
module.exports = {
  friendlyName: 'Update Address',

  description: 'update password for a logged in user.',

  inputs: {
    address: {
      description: 'display address',
      example: '123 main street, Los Angeles CA 90210',
      required: true,
      type: 'string',
    },
    addressComponents: {
      description: 'Google autocomplete address components. stringified JSON',
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Address successfully updated.',
    },

    badRequest: {
      description: 'Error updating address',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const user = this.req.user;
      const { address, addressComponents } = inputs;
      if (!address || !addressComponents) {
        return exits.badRequest({
          message: 'Address and addressComponents are required',
        });
      }
      console.log(address);
      // call google civic api to get the district from the address
      const districtResponse = await civicApiDistrict(address);

      const divisions = districtResponse.divisions;
      const normalizedAddress = JSON.stringify(
        districtResponse.normalizedAddress,
      );

      // const divs = JSON.parse(divisions);
      if (!divisions || !divisions.country || divisions.country.code !== 'us') {
        return exits.badRequest({
          message: 'Currently we support only US elections.',
        });
      }

      // find or create state and district for user divisions.
      const state = await State.findOrCreate(
        { shortName: divisions.state.code.toLowerCase() },
        {
          name: divisions.state.name,
          shortName: divisions.state.code.toLowerCase(),
        },
      );
      let congDistrict;
      if (divisions.cd) {
        congDistrict = await CongDistrict.findOrCreate(
          { ocdDivisionId: divisions.cd.ocdDivisionId },
          {
            name: divisions.cd.name,
            code: divisions.cd.code,
            state: state.id,
            ocdDivisionId: divisions.cd.ocdDivisionId,
          },
        );
      }
      let houseDistrict;
      if (divisions.sldl) {
        houseDistrict = await HouseDistrict.findOrCreate(
          { ocdDivisionId: divisions.sldl.ocdDivisionId },
          {
            name: divisions.sldl.name,
            code: divisions.sldl.code,
            state: state.id,
            ocdDivisionId: divisions.sldl.ocdDivisionId,
          },
        );
      }

      let senateDistrict;
      if (divisions.sldu) {
        senateDistrict = await SenateDistrict.findOrCreate(
          { ocdDivisionId: divisions.sldu.ocdDivisionId },
          {
            name: divisions.sldu.name,
            code: divisions.sldu.code,
            state: state.id,
            ocdDivisionId: divisions.sldu.ocdDivisionId,
          },
        );
      }

      await User.updateOne({ id: user.id }).set({
        address,
        addressComponents,
        normalizedAddress,
        congDistrict: congDistrict
          ? congDistrict.id
          : null,
        houseDistrict: houseDistrict ? houseDistrict.id : null,
        senateDistrict: senateDistrict ? senateDistrict.id : null,
      });

      return exits.success({
        message: 'Address updated',
        congDistrict: divisions.cd,
        houseDistrict: divisions.sldl,
        senateDistrict: divisions.sldu,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error saving address',
      });
    }
  },
};

const civicApiDistrict = async address => {
  const googleApiKey =
    sails.config.custom.googleApiKey || sails.config.googleApiKey;
  const options = {
    uri: `https://www.googleapis.com/civicinfo/v2/representatives?key=${googleApiKey}&address=${encodeURI(
      address.replace(/,/g, ''),
    )}&includeOffices=false`,
    json: true,
  };

  try {
    const civicResponse = await request(options);
    const keys = Object.keys(civicResponse.divisions);
    const district = {
      //format: https://developers.google.com/civic-information/docs/v2/representatives/representativeInfoByAddress
      normalizedAddress: civicResponse.normalizedInput,

      ocdDivisionId: keys[keys.length - 1],
    };

    const divisions = await sails.helpers.ocdDivisionParser(
      civicResponse.divisions,
    );

    district.divisions = divisions;
    return district;
  } catch (err) {
    console.log(err);
  }
};

//301 Studdard Dr, Clanton, AL 35045
