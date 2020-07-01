/**
 * entrance/address-to-district.js
 *
 * @description :: First step of account creation - search zip code to find district
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const request = require('request-promise');

module.exports = {
  friendlyName: 'Login user',

  description:
    'Login user with email and password. Return the user and jwt access token.',

  inputs: {
    address: {
      description: 'display address',
      example: '123 main street, Los Angeles CA 90210',
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
      const { address } = inputs;
      if (!address) {
        return exits.badRequest({
          message: 'Address is required',
        });
      }
      const districtResponse = await civicApiDistrict(address);
      if (!districtResponse) {
        await sails.helpers.errorLoggerHelper(
          'Error: error getting civicApiDistrict',
          { address },
        );
        return exits.badRequest({
          message: 'Error getting address',
        });
      }
      const { divisions, normalizedAddress } = districtResponse;

      if (!divisions || !divisions.country || divisions.country.code !== 'us') {
        return exits.badRequest({
          message: 'Currently we support only US elections.',
        });
      }

      let congDistrict;
      if (divisions.cd) {
        congDistrict = await CongDistrict.findOne({
          ocdDivisionId: divisions.cd.ocdDivisionId,
        });
      }
      return exits.success({
        normalizedAddress,
        district: congDistrict,
        zip: normalizedAddress ? normalizedAddress.zip : '',
        state: normalizedAddress ? normalizedAddress.state.toLowerCase() : '',
      });
    } catch (err) {
      console.log('address to district error');
      console.log(err);
      await sails.helpers.errorLoggerHelper('Error: Address to District', err);
      return exits.badRequest({ message: 'Zip code search failed' });
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
    await sails.helpers.errorLoggerHelper('Error: error civicApiDistrict', err);
  }
};
