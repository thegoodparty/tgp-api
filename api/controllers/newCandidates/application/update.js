module.exports = {
  friendlyName: 'create a issue topic',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    data: {
      type: 'json',
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
      const { id, data } = inputs;
      const user = this.req.user;
      const application = await Application.findOne({
        id,
        user: user.id,
      });
      let existingData = {};
      if (application.data && application.data !== '') {
        existingData = JSON.parse(application.data);
      }
      delete application.data;

      const newData = {
        ...application,
        ...existingData,
        ...data,
      };

      const updated = await Application.updateOne({
        id,
        user: user.id,
      }).set({
        data: JSON.stringify(newData),
      });

      return exits.success({
        application: newData,
      });
    } catch (e) {
      console.log('error at applications/update', e);
      return exits.badRequest({
        message: 'Error updating applications',
        e,
      });
    }
  },
};
