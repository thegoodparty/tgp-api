/**
 * user/register.js
 *
 * @description :: Register user to vote using voteAmerica using https://docs.voteamerica.com/api/action/
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const request = require('request-promise');

module.exports = {
  friendlyName: 'Register to Vote',

  description: 'Register user to vote using voteAmerica using',

  inputs: {
    firstName: {
      type: 'string',
      required: true,
    },
    middleName: {
      type: 'string',
      required: false,
    },
    lastName: {
      type: 'string',
      required: true,
    },
    dob: {
      type: 'string',
      required: true,
      description: 'ISO 8601, e.g. "2020-07-22"',
    },
    email: {
      type: 'string',
      required: true,
      isEmail: true,
    },
    address: {
      type: 'string',
      required: true,
    },

    city: {
      type: 'string',
      required: true,
    },
    state: {
      type: 'string',
      required: true,
      description:
        'Two-character state code, e.g. "MA". 50 states + "DC" are supported.',
    },
    zip: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'User Registered',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error registering to vote',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const {
        firstName,
        middleName,
        lastName,
        dob,
        email,
        address,
        city,
        state,
        zip,
      } = inputs;

      const form = {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        email,
        address1: address,
        city,
        state,
        zipcode: zip,
        sms_opt_in: true,
      };

      const voteAmericaKey =
        sails.config.custom.voteAmericaKey || sails.config.voteAmericaKey;
      const voteAmericaSecret =
        sails.config.custom.voteAmericaSecret || sails.config.voteAmericaSecret;

      const options = {
        uri: `https://api.voteamerica.com/v1/registration/external/request/`,
        method: 'POST',
        json: true,
        body: form,
        auth: {
          user: voteAmericaKey,
          pass: voteAmericaSecret,
        },
      };

      const vaResponse = await request(options);
      console.log('==================');
      console.log(vaResponse);
      console.log('==================');
      return exits.success({
        vaResponse,
      });
    } catch (e) {
      console.log('error at user/register-to-vote');
      console.log(e);
      return exits.badRequest({
        message: 'Error registering user to vote',
      });
    }
  },
};
