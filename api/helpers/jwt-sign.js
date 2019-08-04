const jwt = require('jsonwebtoken');

const ONE_DAY = 60 * 60 * 24;
module.exports = {
  friendlyName: 'JWT Helper for creating JWT',

  description: 'Sign a JWT. https://github.com/auth0/node-jsonwebtoken',

  inputs: {
    payload: {
      friendlyName: 'Payload to sign as a JWT',
      description: 'Valid JSON. in our case a user JSON.',
      type: 'json',
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
  },

  fn: async function(inputs, exits) {
    const token = await jwt.sign(
      {
        data: inputs.payload,
      },
      sails.config.custom.jwtSecret,
      { expiresIn: ONE_DAY },
    );

    return exits.success(token);
  },
};
