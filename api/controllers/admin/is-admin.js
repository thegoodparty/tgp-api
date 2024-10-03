module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Impersonate Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;
      return exits.success(user.isAdmin);
    } catch (err) {
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};
