/**
 * district/state
 *
 * @description :: returns data about one state.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Load State',

  description: 'Returns data about one state.',

  inputs: {
    shortState: {
      type: 'string',
      required: true,
      description: 'Long name of the state',
      example: 'California',
    },
  },

  exits: {
    success: {
      description: 'Able to load state',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error getting state',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { shortState } = inputs;
      const state = await State.findOne({ shortName: shortState.toLowerCase() });
      return exits.success({
        ...state,
      });
    } catch (err) {
      console.log('load state error');
      console.log(err);
      return exits.badRequest({
        message: 'Error getting state.',
      });
    }
  },
};
