/**
 * subscribe/subscribe-email.js
 *
 * @description :: Users can subscribe their email on the homepage
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Subscribe email',

  description:
    'Subscribe email to mailing list on mailChimp.',

  inputs: {
    email: {
      type: 'string',
      isEmail: true
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
      console.log(err);
      return exits.badRequest({ message: 'Error' });
    }
  },
};

