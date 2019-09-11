/**
 * Candidate.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */


module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    firstName: {
      type: 'string',
      required: true,
      description: "Candidate's first name.",
      maxLength: 60,
      example: 'John',
    },

    lastName: {
      type: 'string',
      required: true,
      description: "Candidate's last name.",
      maxLength: 60,
      example: 'Smith',
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
      unique: true,
      maxLength: 200,
      example: 'mary.sue@example.com',
    },

    about: {
      type: 'string',
      required: true,
      maxLength: 11,
      description: 'Summary about the Candidate',
    },

    image: {
      type: 'string',
      required: false,
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

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    state: {
      model: 'state',
    },
  },

  // customToJSON: function () {
  //   // Return a shallow copy of this record with the password removed.
  //   return _.omit(this, ['encryptedPassword', 'passwordResetToken', 'passwordResetTokenExpiresAt']);
  // },
};
