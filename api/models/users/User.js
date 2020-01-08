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

    avatar: {
      type: 'string',
      description: 'Uploaded avatar image',
    },

    invited: {
      type: 'string',
      required: false,
      description: 'array of phone numbers the user invited.',
    },

    crew: {
      type: 'string',
      required: false,
      description: 'array of user ids that are in the user crew',
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

    // many to many relationship with itself. a user can recruit many users and a user can be recruited by many users.
    recruitedBy: {
      collection: 'user',
      via: 'recruits',
    },
    recruits: {
      collection: 'user',
      via: 'recruitedBy',
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
      const adminPhones =
        sails.config.custom.adminPhones || sails.config.adminPhones;
      if (adminPhones && adminPhones.includes(values.phone)) {
        values.role = sails.config.custom.rolesEnums.ADMIN;
      } else {
        if (values.role !== sails.config.custom.rolesEnums.CANDIDATE) {
          values.role = sails.config.custom.rolesEnums.VOTER;
        }
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
      const { id, phone, name } = newUser;
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

      return next();
    } catch (e) {
      console.log('error', e);
      return next(e);
    }
  },
};
