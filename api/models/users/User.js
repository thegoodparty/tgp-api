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
      isEmail: true,
      unique: true,
      maxLength: 200,
      example: 'mary.sue@example.com',
    },

    name: {
      type: 'string',
      required: false,
      description: "User's name.",
      maxLength: 120,
      example: 'John Smith',
    },

    firstName: {
      type: 'string',
      required: false,
      maxLength: 120,
      example: 'John',
    },

    lastName: {
      type: 'string',
      required: false,
      maxLength: 120,
      example: 'Smith',
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

    zip: {
      type: 'string',
      required: false,
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

    password: {
      type: 'string',
      description:
        "Securely hashed representation of the user's login password.",
      protect: true,
      example: '2$28a8eabna301089103-13948134nad',
    },

    hasPassword: {
      type: 'boolean',
      description: 'is the password field used.',
    },

    passwordResetToken: {
      type: 'string',
      description:
        "A unique token used to verify the user's identity when recovering a password.  Expires after 1 use, or after a set amount of time has elapsed.",
    },

    passwordResetTokenExpiresAt: {
      type: 'number',
      description:
        "A JS timestamp (epoch ms) representing the moment when this user's `passwordResetToken` will expire (or 0 if the user currently has no such token).",
      example: 1502844074211,
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

    voteStatus: {
      type: 'string',
      required: false,
      description: 'voting status - null, verified, na',
    },

    isAdmin: {
      type: 'boolean',
      defaultsTo: false,
      required: false,
      allowNull: true,
    },
    metaData: {
      type: 'string',
    },

    displayName: {
      type: 'string',
    },

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    notifications: {
      collection: 'notification',
      via: 'user',
    },

    applications: {
      collection: 'application',
      via: 'user',
    },

    // a user can be a staff for multiple candidates.
    staff: {
      collection: 'staff',
      via: 'user',
    },

    campaignClaims: {
      collection: 'campaignClaim',
      via: 'user',
    },

    campaigns: {
      collection: 'campaign',
      via: 'user',
    },

    campaignsUpdateHistories: {
      collection: 'campaignUpdateHistory',
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

  customToJSON: function () {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, [
      'password',
      'passwordResetToken',
      'passwordResetTokenExpiresAt',
      'createdAt',
      'updatedAt',
      'emailConfToken',
      'emailConfTokenDateCreated',
    ]);
  },

  beforeCreate: async function (values, next) {
    try {
      // hash password and save it in password.
      // using hashPassword helper from sails-hook-organics
      if (values.password) {
        const hashedPassword = await sails.helpers.passwords.hashPassword(
          values.password,
        );
        values.password = hashedPassword;
        values.hasPassword = true;
      }

      if (values.email) {
        // set isAdmin.
        const adminEmails =
          sails.config.custom.adminEmails || sails.config.adminEmails;
        if (adminEmails && adminEmails.includes(values.email)) {
          values.isAdmin = true;
        } else {
          values.isAdmin = false;
        }
      }

      if (values.email) {
        // const token = await sails.helpers.strings.random('url-friendly');
        const token = Math.floor(100000 + Math.random() * 900000) + '';
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
