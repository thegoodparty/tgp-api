/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Log admin user as a candidate',

  inputs: {
    id: {
      description: 'Candidate Id',
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Login Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id } = inputs;
      const users = await User.find({ candidate: id });
      if (!users || users.length === 0) {
        return exits.badRequest({
          message: 'No user found',
        });
      }

      const token = await sails.helpers.jwtSign({
        id: users[0].id,
      });
      return exits.success({ token });
    } catch (err) {
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};
