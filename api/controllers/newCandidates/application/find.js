module.exports = {
  friendlyName: 'create a candidate application',

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
      let application;
      let reviewMode = false;
      if (user.isAdmin) {
        application = await Application.findOne({
          id,
        });
        if (user.id !== application.user.id) {
          reviewMode = true;
        }
      } else {
        application = await Application.findOne({
          id,
          user: user.id,
        });
      }
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
        reviewMode,
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
