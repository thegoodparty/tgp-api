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
    },
    lastName: {
      type: 'string',
      required: true,
    },
    suffix: {
      type: 'string',
    },
    dob: {
      type: 'string',
      required: true,
      description: 'ISO 8601, e.g. "2020-07-22"',
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
    phone: {
      type: 'string',
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
        suffix,
        dob,
        address,
        city,
        state,
        zip,
        phone,
      } = inputs;

      const form = {
        first_name: firstName,
        last_name: lastName,
        address,
        city,
        state,
        zip,
      };
      if (middleName) {
        form.middle_name = middleName;
      }
      if (suffix) {
        form.suffix = suffix;
      }
      if (dob) {
        form.birth_date = dob;
      }
      if (phone) {
        form.phone_num = phone;
      }

      const alloyKey = sails.config.custom.alloyKey || sails.config.alloyKey;
      const alloySecret =
        sails.config.custom.alloySecret || sails.config.alloySecret;

      const options = {
        uri: `https://api.alloy.us/v1/verify?${serialize(form)}`,
        method: 'GET',
        json: true,
        auth: {
          user: alloyKey,
          pass: alloySecret,
        },
      };

      const response = await request(options);
      if (response.error) {
        return exits.badRequest({
          message: response.error,
        });
      }
      let voteStatus = '';
      if (response.data && response.data.registration_status) {
        const status = response.data.registration_status;
        if (status === 'Active') {
          voteStatus = 'verified';
        } else if (status === 'ZIP Not Yet Supported') {
          voteStatus = 'na';
        }
      }
      const user = this.req.user;
      const updateFields = {
        firstName,
        middleName,
        lastName,
        suffix,
        dob,
        address,
        city,
        voteStatus,
      };
      await User.updateOne({ id: user.id }).set(updateFields);

      return exits.success({
        voteStatus,
      });
    } catch (e) {
      console.log('error at voterize/verify-vote');
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at user/verify-vote', e);
      return exits.badRequest({
        message: 'Error registering user to vote',
      });
    }
  },
};

const serialize = obj => {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
    }
  return str.join('&');
};
