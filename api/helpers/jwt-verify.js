const jwt = require('jsonwebtoken');

const ONE_DAY = 60 * 60 * 24;
module.exports = {


  friendlyName: 'JWT helper to verify jwt',


  description: 'Verify JWT. https://github.com/auth0/node-jsonwebtoken',


  inputs: {

    token: {
      friendlyName: 'a JWT token',
      description: 'Valid JSON. in our case a user JSON.',
      type: 'string',
    },

    callback: {
      friendlyName: 'callback',
      description: 'callback',
      type: 'ref',
    },
  },


  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok'
    },
  },


  fn: async function (inputs, exits) {
    const verify = await jwt.verify(inputs.token, sails.config.secret);
    return await exits.success(verify);

  }

};
