/**
 * subscribe/subscribe-email.js
 *
 * @description :: Users can subscribe their email on the homepage
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

<<<<<<< HEAD
=======
const mailchimp = require('@mailchimp/mailchimp_marketing');

const apiKey = sails.config.custom.MAILCHIMP_API || sails.config.MAILCHIMP_API;
const server =
  sails.config.custom.MAILCHIMP_SERVER || sails.config.MAILCHIMP_SERVER;

mailchimp.setConfig({
  apiKey,
  server,
});

>>>>>>> a29ca0de3349421b336449d4a24ab6f87abf32c8
module.exports = {
  friendlyName: 'Subscribe email',

  description: 'Subscribe email to mailing list on mailChimp.',

  inputs: {
    email: {
      type: 'string',
      isEmail: true,
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
      let res;
      if(email) {
        res = await sails.helpers.addEmail(email);
      }
      else {
        const users = await User.find();
        for(let i = 0; i < users.length; i++) {
          if(users[i].email) {
            console.log(users[i].email)
            await sails.helpers.addEmail(users[i].email);
          }
        }
      }
      return exits.success(res);
    } catch (err) {
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
