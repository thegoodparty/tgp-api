/**
 * subscribe/subscribe-email.js
 *
 * @description :: Users can subscribe their email on the homepage
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Subscribe email',

  description: 'Subscribe email to mailing list on mailChimp.',

  inputs: {
    email: {
      required: true,
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

  fn: async function (inputs, exits) {
    try {
      const { email } = inputs;
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const res = await sails.helpers.addEmail(
        email,
        'The Good Party'
      );

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
