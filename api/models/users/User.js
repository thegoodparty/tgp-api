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
      required: true,
      unique: true,
      maxLength: 11,
      example: '3101234567',
    },

    email: {
      type: 'string',
      isEmail: true,
      maxLength: 200,
      example: 'mary.sue@example.com',
    },

    firstName: {
      type: 'string',
      required: false,
      description: "User's first name.",
      maxLength: 60,
      example: 'John',
    },

    lastName: {
      type: 'string',
      required: false,
      description: "User's last name.",
      maxLength: 60,
      example: 'Smith',
    },

    address: {
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

    // encryptedPassword: {
    //   type: 'string',
    //   description:
    //     "Securely hashed representation of the user's login password.",
    //   protect: true,
    //   example: '2$28a8eabna301089103-13948134nad',
    // },
    //
    // passwordResetToken: {
    //   type: 'string',
    //   description:
    //     "A unique token used to verify the user's identity when recovering a password.  Expires after 1 use, or after a set amount of time has elapsed.",
    // },
    //
    // passwordResetTokenExpiresAt: {
    //   type: 'number',
    //   description:
    //     "A JS timestamp (epoch ms) representing the moment when this user's `passwordResetToken` will expire (or 0 if the user currently has no such token).",
    //   example: 1502844074211,
    // },

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    role: {
      model: 'role',
    },

    congressionalDistrict: {
      model: 'congressionalDistrict',
    },

    houseDistrict: {
      model: 'houseDistrict',
    },

    senateDistrict: {
      model: 'senateDistrict',
    },

    candidates: {
      collection: 'candidate',
      via: 'user',
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
    ]);
  },

  // hash password and save it in encryptedPassword.
  // using hashPassword helper from sails-hook-organics
  beforeCreate: async function(values, next) {
    // Hash password
    try {
      // const hashedPassword = await sails.helpers.passwords.hashPassword(
      //   values.password,
      // );
      // values.encryptedPassword = hashedPassword;
      // // Delete the passwords so that they are not stored in the DB
      // values.password = '';

      // set role. Voter by default (if non is provided).
      if (values.role !== 20) {
        values.role = 10;
      }

      // calling the callback next() with an argument returns an error. Useful for canceling the entire operation if some criteria fails.

      return next();
    } catch (e) {
      return next(e);
    }
  },
};
