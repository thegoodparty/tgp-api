module.exports = {
  friendlyName: 'create a issue topic',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

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
      const { id } = inputs;
      const user = this.req.user;
      const application = await Application.findOne({
        id,
        user: user.id,
      });
      let data = {};
      if (application.data && application.data !== '') {
        data = JSON.parse(application.data);
      }
      delete application.data;
      return exits.success({
        application: {
          ...application,
          ...data,
        },
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
