module.exports = {
  friendlyName: 'Wakeup DB',

  inputs: {},

  exits: {
    success: {
      description: 'I am awake.',
    },
    serverError: {
      description: 'There was a problem on the server.',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const query = `SELECT "LALVOTERID" FROM public."VoterCA" where "LALVOTERID" = 'LALCA3184219' limit 1`;
      return await sails.helpers.voter.csvStreamHelper(query, this.res);
    } catch (error) {
      console.error('Error at wakeup:', error);
      return exits.serverError(error);
    }
  },
};
