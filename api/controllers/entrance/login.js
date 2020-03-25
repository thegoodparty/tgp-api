/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Login user',

  description:
    'Login user with email and password. Return the user and jwt access token.',

  inputs: {
    email: {
      description: 'User Phone',
      type: 'string',
      required: true,
      isEmail: true,
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Phone Format Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { email } = inputs;

      const user = await User.findOne({ email });
      if (!user) {
        return exits.success(); //we don't disclose whether we have a user in the db or not
      }

      let randomCode = parseInt(Math.random() * 1000000);
      if (randomCode < 100000) {
        randomCode += 124000;
      }

      await User.updateOne({ email }).set({
        emailConfToken: randomCode,
        emailConfTokenDateCreated: Date.now(),
      });

      const subject = `Your Good Party login code is: ${randomCode}`;
      const message = `Hi ${user.name},<br/> <br/>
                         Please use the code below to complete your login process.<br/>
                         This code will expire in 24 hours. <br/> <br/>
                         <h2>${randomCode}</h2>`;
      const messageHeader = `Your Good Party login code is: ${randomCode}`;
      await sails.helpers.mailgunSender(
        email,
        user.name,
        subject,
        messageHeader,
        message,
      );

      return exits.success();
    } catch (err) {
      console.log('login error');
      console.log(err);
      return exits.success();
    }
  },
};
