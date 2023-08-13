module.exports = {
  inputs: {
    user: {
      type: 'json',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = inputs;
      if (!user.metaData || user.metaData === '') {
        return exits.success(true);
      }
      const metaData = JSON.parse(user.metaData);
      if (
        typeof metaData.notificationEmails === 'undefined' ||
        metaData.notificationEmails
      ) {
        return exits.success(true);
      }

      return exits.success(false);
    } catch (e) {
      console.log('error at goodness helper', e);
      return exits.success(false);
      //
      // return exits.badRequest({
      //   message: 'Error evaluating goodness',
      // });
    }
  },
};
