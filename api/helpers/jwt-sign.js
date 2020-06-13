const jwt = require('jsonwebtoken');

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


  fn: async function(inputs, exits) {
    const token = await jwt.sign(
      {
        data: inputs.payload,
      },
      sails.config.custom.jwtSecret,
      { expiresIn: '365 days' },
    );

    return exits.success(token);
  },
};
