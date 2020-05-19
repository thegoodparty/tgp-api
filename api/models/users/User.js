/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    phone: {
      type: 'string',
      required: false,
      // unique: true,
      maxLength: 11,
      example: '3101234567',
    },

    email: {
      type: 'string',
      required: true,
      isEmail: true,
      unique: true,
      maxLength: 200,
      example: 'mary.sue@example.com',
    },

    uuid: {
      type: 'string',
      required: true,
      unique: true,
      maxLength: 200,
      example: 'random string',
    },

    name: {
      type: 'string',
      required: false,
      description: "User's name.",
      maxLength: 120,
      example: 'John Smith',
    },

    feedback: {
      type: 'string',
      required: false,
      description: "User's Feedback",
      maxLength: 140,
    },

    socialId: {
      type: 'string',
      required: false,
      description: 'Social Channel Id',
      allowNull: true,
    },

    socialProvider: {
      type: 'string',
      required: false,
      description: 'Social Channel',
      example: 'facebook',
      allowNull: true,
    },

    displayAddress: {
      type: 'string',
      required: false,
      description: "User's display address",
      example: '123 main road Los Angeles, CA 91210',
    },

    addressComponents: {
      type: 'string',
      required: false,
      description: 'Google auto-complete address components',
    },

    normalizedAddress: {
      description: 'Normalized address from civic api. stringified JSON',
      required: false,
      type: 'string',
    },

    isPhoneVerified: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Was the phone verified via sms',
    },

    isEmailVerified: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Was the email verified',
    },

    avatar: {
      type: 'string',
      description: 'Uploaded avatar image',
    },

    emailConfToken: {
      type: 'string',
      required: false,
      description: 'token to validate email',
    },
    emailConfTokenDateCreated: {
      type: 'string',
      required: false,
      description: 'date that the token was created',
    },

    presidentialRank: {
      type: 'string',
      required: false,
      description: 'array of presidential candidates IDs',
    },

    senateRank: {
      type: 'string',
      required: false,
      description: 'array of senate candidates IDs',
    },

    houseRank: {
      type: 'string',
      required: false,
      description: 'array of house candidates IDs',
    },

    // adding (denormalized) state and district for quick lookups.
    shortState: {
      type: 'string',
      required: false,
      description: 'short state (ca)',
    },
    districtNumber: {
      type: 'number',
      required: false,
      description: 'cong district number',
      allowNull: true,
    },
    guestReferrer: {
      type: 'string',
      required: false,
      description: 'guest uuid that was used to invited the user.',
    },
    isAdmin: {
      type: 'boolean',
      defaultsTo: false,
      required: false,
    },

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    role: {
      model: 'role',
    },

    congDistrict: {
      model: 'congDistrict',
    },

    senateDistrict: {
      model: 'senateDistrict',
    },

    zipCode: {
      model: 'zipCode',
    },

    rankings: {
      collection: 'ranking',
      via: 'user',
    },

    // has many to itself - a user can invite many users.
    crew: {
      collection: 'user',
      via: 'referrer',
    },

    referrer: {
      model: 'user',
    },
  },

  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, [
      'encryptedPassword',
      'passwordResetToken',
      'passwordResetTokenExpiresAt',
      'createdAt',
      'updatedAt',
      'emailConfToken',
      'emailConfTokenDateCreated',
    ]);
  },

  beforeCreate: async function(values, next) {
    try {
      if (values.email) {
        // set role. Voter by default (if non is provided).
        const adminEmails =
          sails.config.custom.adminEmails || sails.config.adminEmails;
        if (adminEmails && adminEmails.includes(values.email)) {
          values.isAdmin = true;
        } else {
          values.isAdmin = false;
        }
      }

      if (values.email) {
        const token = await sails.helpers.strings.random('url-friendly');
        values.emailConfToken = token;
        values.emailConfTokenDateCreated = Date.now();
      }

      // calling the callback next() with an argument returns an error. Useful for canceling the entire operation if some criteria fails.

      return next();
    } catch (e) {
      return next(e);
    }
  },
};
