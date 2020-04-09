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
    },
    guestReferrer: {
      type: 'string',
      required: false,
      description: 'guest uuid that was used to invited the user.',
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

    houseDistrict: {
      model: 'houseDistrict',
    },

    senateDistrict: {
      model: 'senateDistrict',
    },

    zipCode: {
      model: 'zipCode',
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

      if (values.phone) {
        // set role. Voter by default (if non is provided).
        const adminPhones =
          sails.config.custom.adminPhones || sails.config.adminPhones;
        if (adminPhones && adminPhones.includes(values.phone)) {
          values.role = sails.config.custom.rolesEnums.ADMIN;
        } else {
          if (values.role !== sails.config.custom.rolesEnums.CANDIDATE) {
            values.role = sails.config.custom.rolesEnums.VOTER;
          }
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
  afterCreate: async function(newUser, next) {
    // check if the newly created user exists in invited table. If so, update all those who invited the new user.
    // then remove the row from invited table.
    try {
      /*
      const { id, phone } = newUser;

      // invited logic
      const invitedPhone = await Invited.findOne({ phone });
      if (!invitedPhone) {
        return next();
      }
      const invitedBy = JSON.parse(invitedPhone.invitedBy);
      const invitedByIds = [];
      // send message to the users that invited the new recruit
      for (let i = 0; i < invitedBy.length; i++) {
        invitedByIds.push(invitedBy[i].id);
        const inviter = await User.findOne({ id: invitedBy[i].id });
        if (inviter) {
          await sails.helpers.sendSms(
            `+1${inviter.phone}`,
            `Good News: ${invitedBy[i].name}  just joined the Good Party! 🙏❤️🎉 https://exp.host/@tgp-expo/tgp-native-apps`,
          );
        }
      }

      await User.addToCollection(id, 'recruitedBy', invitedByIds);

      // remove row from invited table.
      const deleted = await Invited.destroyOne({ id: invitedPhone.id });
      console.log('deleted', deleted);
      */

      return next();
    } catch (e) {
      console.log('error', e);
      return next();
    }
  },
};
