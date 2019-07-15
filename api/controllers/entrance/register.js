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
      required: true
    },
    password: {
      description: 'User Password',
      type: 'string',
      required: true,
      minLength: 8
    },
    firstName: {
      description: 'User First Name',
      type: 'string',
      required: true
    },
    lastName: {
      description: 'User Last Name',
      type: 'string',
      required: true
    }
  },

  exits: {
    success: {
      description: 'User Created',
      responseType: 'ok'
    },
    badRequest: {
      description: 'register Failed',
      responseType: 'badRequest'
    }
  },

  fn: async function (inputs, exits) {

    // Look up the user whose ID was specified in the request.
    // Note that we don't have to validate that `userId` is a number;
    // the machine runner does this for us and returns `badRequest`
    // if validation fails.

    const {
      email,
      password,
      firstName,
      lastName
    } = inputs;
    try {
      await User.create({
        email,
        password,
        firstName,
        lastName
      });
      const user = await User.findOne({email});
      return exits.success({
        user,
        token: sails.helpers.jwtSign(user)//generate the token and send it in the response
      });
    } catch (e) {
      return exits.badRequest(e);
    }

  }
};
