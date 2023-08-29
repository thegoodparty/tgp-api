const axios = require('axios');
const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;

module.exports = {
  inputs: {
    metaData: {
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'User successfully updated.',
    },

    badRequest: {
      description: 'Error updating user',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;
      const { metaData } = inputs;

      const updated = await User.updateOne({ id: user.id }).set({ metaData });
      const metaDataObj = JSON.parse(metaData);

      if (
        metaDataObj.hasOwnProperty('marketingEmails') &&
        metaDataObj.marketingEmails === false
      ) {
        // https://legacydocs.hubspot.com/docs/methods/email/update_status
        let email = user.email;
        const url = `https://api.hubapi.com/email/public/v1/subscriptions/${email}`;
        console.log('url', url);
        const payload = { unsubscribeFromAll: true };
        await axios.put(url, payload, {
          headers: {
            Authorization: `Bearer ${hubSpotToken}`,
          },
        });
      }

      return exits.success({
        user: updated,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error updating user notification preferences',
        e,
      );
      return exits.badRequest({
        message: 'Error updating user',
      });
    }
  },
};
