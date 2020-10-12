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
      let voteStatus = '';
      if (state === 'CA') {
        voteStatus = await targetSmartVerify(form);
      } else {
        voteStatus = await alloyVerify(form);
        if (voteStatus !== 'verified') {
          voteStatus = await targetSmartVerify(form);
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

const alloyVerify = async form => {
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
    throw 'badRequest';
  }
  if (response.data && response.data.registration_status) {
    const status = response.data.registration_status;
    if (status === 'Active') {
      return 'verified';
    } else if (status === 'ZIP Not Yet Supported') {
      return 'na';
    }
  }
  return '';
};

const targetSmartVerify = async form => {
  const targetSmartKey =
    sails.config.custom.targetSmartKey || sails.config.targetSmartKey;

  const street_number = form.address ? form.address.match(/\d+/)[0] : null;
  const street_name = form.address
    ? form.address.match(/\s[A-z]+\s[A-z]+/)[0].trim()
    : null;
  const smartForm = {
    first_name: form.first_name,
    last_name: form.last_name,
    street_number,
    street_name,
    city: form.city,
    state: form.state,
    zip_code: form.zip,
    dob: form.birth_date
      ? `${form.birth_date.substring(0, 4)}****`
      : form.birth_date,
    // phone: form.phone_num,
    unparsed_full_address: `${form.address}, ${form.city}, ${form.state} ${form.zip}`,
  };

  console.log(smartForm);

  const options = {
    uri: `https://api.targetsmart.com/voter/voter-registration-check?${serialize(
      smartForm,
    )}`,
    method: 'GET',
    json: true,
    headers: {
      'x-api-key': targetSmartKey,
    },
  };
  const response = await request(options);
  if (response.error) {
    throw 'badRequest';
  }
  if (response.result) {
    const status = response.result_set[0]['vb.voterbase_registration_status'];
    if (status === 'Registered') {
      return 'verified';
    }
  }
  return '';
};
