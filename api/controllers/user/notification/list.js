module.exports = {
  friendlyName: 'User notifications',

  inputs: {},

  exits: {
    success: {
      description: 'found',
    },

    badRequest: {
      description: 'Error finding notification',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let { user } = this.req;
      const notifications = await Notification.find({
        user: user.id,
      }).sort([{ id: 'DESC' }]);

      return exits.success({
        notifications,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error finding notifications',
      });
    }
  },
};
