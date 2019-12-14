/**
 * entrance/zipToDistrict.js
 *
 * @description :: First step of account creation - search zip code to find district
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Login user',

  description:
    'Login user with email and password. Return the user and jwt access token.',

  inputs: {
    zip: {
      description: 'Zip Code',
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Zip Error',
      responseType: 'badRequest',
    },
    notFound: {
      description: 'Zip Code Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { zip } = inputs;

      const zipCode = await ZipCode.find({ zip }).populate(
        'congressionalDistrict',
      );
      if (!zipCode) {
        return exits.notFound({ message: 'Failed to find zip code' });
      }
      return exits.success({
        zipCode,
      });
    } catch (err) {
      console.log('zip to district error');
      console.log(err);
      return exits.badRequest({ message: 'Zip code search failed' });
    }
  },
};
