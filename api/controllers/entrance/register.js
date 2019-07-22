/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'register user',

  description: 'register a user with email, password first and last name',

  inputs: {
    email: {
      description: 'User Email',
      type: 'string',
      required: true,
    },
    password: {
      description: 'User Password',
      type: 'string',
      required: true,
      minLength: 8,
    },
  },

  exits: {
    success: {
      description: 'User Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'register Failed',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    // Look up the user whose ID was specified in the request.
    // Note that we don't have to validate that `userId` is a number;
    // the machine runner does this for us and returns `badRequest`
    // if validation fails.


    const { email, password } = inputs;
    const lowerCaseEmail = email.toLowerCase();
    try {
      const user = await User.create({
        email: lowerCaseEmail,
        password,
      }).fetch();
      const token = await sails.helpers.jwtSign(user);
      return exits.success({
        user,
        token,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest(e);
    }
  },
};
