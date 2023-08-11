module.exports = {
  friendlyName: 'User notifications',

  inputs: {},

  exits: {
    success: {
      description: 'updated',
    },

    badRequest: {
      description: 'Error updating notification',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let { user } = this.req;
      await Notification.update({
        user: user.id,
      }).set({ isRead: true });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error updating notifications',
      });
    }
  },
};
