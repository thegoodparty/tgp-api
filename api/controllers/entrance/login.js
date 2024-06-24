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
      description: 'User Email',
      type: 'string',
      isEmail: true,
      required: true,
    },

    password: {
      description: 'User Password',
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Login Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { email, password } = inputs;

      const lowerCaseEmail = email.toLowerCase();
      const user = await User.findOne({ email: lowerCaseEmail });

      if (!user) {
        // register
        const user = await User.create({
          email: lowerCaseEmail,
          password,
        }).fetch();

        const token = await sails.helpers.jwtSign({
          id: user.id,
          email: lowerCaseEmail,
        });
        await sails.helpers.crm.updateUser(user);

        this.res.cookie('token', token, {
          domain: '.goodparty.org', // Root domain
          secure: process.env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS
          httpOnly: true, // Ensures the cookie is only accessible via HTTP(S), not JavaScript
          sameSite: 'None', // Allows the cookie to be sent with cross-site requests
        });

        return exits.success({
          user,
          token,
          newUser: true,
        });
      } else {
        try {
          await sails.helpers.passwords.checkPassword(password, user.password);
        } catch (e) {
          return exits.badRequest({});
        }

        const token = await sails.helpers.jwtSign({
          id: user.id,
          email: user.email,
        });

        this.res.cookie('token', token, {
          domain: '.goodparty.org', // Root domain
          secure: process.env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS
          httpOnly: true, // Ensures the cookie is only accessible via HTTP(S), not JavaScript
          sameSite: 'None', // Allows the cookie to be sent with cross-site requests
        });

        try {
          await sails.helpers.crm.updateUser(user, true);
        } catch (e) {
          console.log('error updating user in crm', e);
          await sails.helpers.slack.errorLoggerHelper(
            'Error at entrance/login.js',
            e,
          );
        }
        return exits.success({ user, token, newUser: false });
      }
    } catch (err) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error at entrance/login',
        err,
      );
      console.log('login error');
      console.log(err);
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};
