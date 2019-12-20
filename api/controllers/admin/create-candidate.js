/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Create Candidate',

  description: 'Admin endpoint to create a candidate.',

  inputs: {
    name: {
      type: 'string',
      required: true,
      description: "Candidate's name.",
      maxLength: 120,
      example: 'John Smith',
    },

    phone: {
      type: 'string',
      required: true,
      maxLength: 11,
      example: '3101234567',
    },

    email: {
      type: 'string',
      isEmail: true,
      required: true,
      maxLength: 200,
      example: 'mary.sue@example.com',
    },

    about: {
      type: 'string',
      required: true,
      maxLength: 11,
      description: 'Summary about the Candidate',
    },

    shortState: {
      type: 'string',
      required: true,
      maxLength: 2,
      description: 'State Related to candidate',
      example: 'CA',
    },

    longState: {
      type: 'string',
      required: true,
      description: 'State Related to candidate',
      example: 'California',
    },

    image: {
      type: 'string',
      required: true,
      description: 'url of a profile image',
    },

    facebookUrl: {
      type: 'string',
      required: false,
    },

    twitterUrl: {
      type: 'string',
      required: false,
    },

    instagramUrl: {
      type: 'string',
      required: false,
    },

    website: {
      type: 'string',
      required: false,
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
    try {
      const {
        firstName,
        lastName,
        phone,
        email,
        shortState,
        longState,
        about,
        image,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        website,
      } = inputs;
      const phoneError = !/^\d{10}$/.test(phone);
      if (phoneError) {
        return exits.badRequest({
          message: 'Accepting 10 digits phone numbers only. EX: 3104445566',
        });
      }

      // find or create state
      const state = await State.findOrCreate(
        { shortName: shortState.toLowerCase() },
        {
          name: longState,
          shortName: shortState.toLowerCase(),
        },
      );

      // upload image to S3

      const candidate = await Candidate.create({
        firstName,
        lastName,
        phone,
        email,
        state: state.id,
        about,
        image,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        website,
      }).fetch();

      return exits.success({
        candidate,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error registering candidate.' });
    }
  },
};
