module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'success',
    },

    badRequest: {
      description: 'Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;
      const { metaData } = user;
      const data = metaData ? JSON.parse(metaData) : {};
      return exits.success({
        metaData: data,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('Error getting user meta', e);
      return exits.badRequest({
        message: 'Error getting user meta',
      });
    }
  },
};
