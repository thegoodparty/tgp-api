module.exports = {
  inputs: {
    user: {
      type: 'json',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = inputs;

      if (!user.phone) {
        return exits.success(false);
      }
      if (!user.metaData || user.metaData === '') {
        // not set yet, default is true
        return exits.success(true);
      }

      const metaData = JSON.parse(user.metaData);
      if (
        typeof metaData.textNotification === 'undefined' ||
        metaData.textNotification
      ) {
        return exits.success(true);
      }
      return exits.success(false);
    } catch (e) {
      console.log('error at can text helper', e);
      return exits.success(false);
    }
  },
};
