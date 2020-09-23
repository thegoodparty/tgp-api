/**
 * subscribe/subscribe-email.js
 *
 * @description :: Users can subscribe their email on the homepage
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const mailchimp = require("@mailchimp/mailchimp_marketing");

const apiKey = sails.config.custom.MAILCHIMP_API || sails.config.MAILCHIMP_API;
const server = sails.config.custom.MAILCHIMP_SERVER || sails.config.MAILCHIMP_SERVER;

mailchimp.setConfig({
  apiKey,
  server
});

module.exports = {
  friendlyName: 'Subscribe email',

  description:
    'Subscribe email to mailing list on mailChimp.',

  inputs: {
    email: {
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Email has been subscribed successfuly',
    },

    badRequest: {
      description: 'Error subscribing email',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { email } = inputs;
      const res = await subscribeEmail(email);
      return exits.success(res);
    } catch (err) {
      console.log('address to district error');
      console.log(err);
      return exits.badRequest({ message: 'Error subscribing email' });
    }
  },
};

const subscribeEmail = async email => {
  const subscribingUser = {
    email
  };
  const { lists } = await mailchimp.lists.getAllLists()
  const tgpList = lists.find(list => list.name === 'The Good Party');
  const response = await mailchimp.lists.addListMember(tgpList.id, {
    email_address: subscribingUser.email,
    status: "subscribed",
  });
  return response;
};
