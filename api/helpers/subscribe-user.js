const mailchimp = require('@mailchimp/mailchimp_marketing');

const apiKey = sails.config.custom.MAILCHIMP_API || sails.config.MAILCHIMP_API;
const server =
  sails.config.custom.MAILCHIMP_SERVER || sails.config.MAILCHIMP_SERVER;

mailchimp.setConfig({
  apiKey,
  server,
});

module.exports = {
  friendlyName: 'Votes Needed Helper',

  inputs: {
    email: {
      type: 'string',
      isEmail: true,
      required: true,
    },
  },
  exits: {
    success: {
      description: 'Email has been subscribed successfully',
    },

    badRequest: {
      description: 'Error subscribing email',
    },
  },
  async fn(inputs, exits) {
    try {
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      let response;
      let { email } = inputs;
      const listName =
        appBase === 'https://goodparty.org' ? 'Good Party' : 'Good Party Dev';
      const subscribingUser = {
        email,
      };
      const { lists } = await mailchimp.lists.getAllLists();
      const tgpList = lists.find(list => list.name === listName);
      if (tgpList) {
        response = await mailchimp.lists.addListMember(tgpList.id, {
          email_address: subscribingUser.email,
          status: 'subscribed',
        });
      }
      return exits.success(response);
    } catch (err) {
      console.log(err);
      if (err && err.response && err.response.text) {
        const parsedText = JSON.parse(err.response.text);
        return exits.badRequest({
          message: `Error: ${parsedText.title}`,
        });
      } else {
        return exits.badRequest({ message: 'Error subscribing email' });
      }
    }
  },
};
