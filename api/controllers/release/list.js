module.exports = {
  friendlyName: 'list of the releases',

  inputs: {},

  exits: {
    success: {
      description: 'Loaded',
    },

    badRequest: {
      description: 'Error loading',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const releases = await Release.find().sort([{ createdAt: 'ASC' }]);
      return exits.success({
        releases,
      });
    } catch (e) {
      console.log('error at release/load', e);
      return exits.badRequest({
        message: 'Error loading releases',
        e,
      });
    }
  },
};
