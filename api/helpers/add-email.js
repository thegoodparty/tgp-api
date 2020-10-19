
const mailchimp = require("@mailchimp/mailchimp_marketing");

const apiKey = sails.config.custom.MAILCHIMP_API || sails.config.MAILCHIMP_API;
const server = sails.config.custom.MAILCHIMP_SERVER || sails.config.MAILCHIMP_SERVER;

mailchimp.setConfig({
  apiKey,
  server
});

module.exports = {
  friendlyName: 'Votes Needed Helper',

  inputs: {
    email: {
      type: 'string',
      isEmail: true,
      required: true
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { email } = inputs;
      const subscribingUser = {
        email
      };
      const { lists } = await mailchimp.lists.getAllLists()
      const tgpList = lists.find(list => list.name === 'The Good Party');
      const response = await mailchimp.lists.addListMember(tgpList.id, {
        email_address: subscribingUser.email,
        status: "subscribed",
      });
      return exits.success(response);
    } catch (e) {
      console.log(e)
    }
  },
};
