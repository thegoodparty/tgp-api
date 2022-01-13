module.exports = {
  friendlyName: 'create a issue topic',

  inputs: {},

  exits: {
    success: {
      description: 'Created',
    },

    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const applications = await Application.find({
        status: 'in review',
      }).populate('user');

      return exits.success({
        applications,
      });
    } catch (e) {
      console.log('error at application/list', e);
      return exits.badRequest({
        message: 'Error finding applications',
        e,
      });
    }
  },
};
