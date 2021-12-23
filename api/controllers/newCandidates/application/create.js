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
      const user = this.req.user;
      const application = await Application.create({
        user: user.id,
      }).fetch();

      return exits.success({
        id: application.id,
      });
    } catch (e) {
      console.log('error at applications/create', e);
      return exits.badRequest({
        message: 'Error creating applications',
        e,
      });
    }
  },
};
