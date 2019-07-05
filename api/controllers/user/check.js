/**
 * user/check.js
 *
 * @description :: Returning user from jwt.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {

  friendlyName: 'Check user',

  description: 'Return user from jwt',

  inputs: {
    user: {
      description: 'User',
      type: 'ref',
    },
  },

  exits: {
    success: {
      description: 'Check passed.',
      responseType: 'ok'
    },
    forbidden: {
      description: 'Bad token',
      responseType: 'forbidden'
    }
  },

  fn: async function (inputs, exits) {
    return exits.success({
      user: this.req.user,
    });
  }
};
