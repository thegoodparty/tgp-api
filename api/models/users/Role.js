/**
 * Role.js
 * Using the beforeCreate rule and the uniqeness of the accessLevel we ensure that we can have max of 3 roles
 * only with the permissions defined in our custom variables
 *
 * @description :: User Roles such as superAdmin, admin, artist or fan. Has one-to-many association with user.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */


module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    accessLevel: {
      type: 'number',
      required: true,
      description: 'Role access level',
      unique: true,
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    users: {
      collection: 'user',
      via: 'role',
    },
  },

  beforeCreate: function(values, next) {
    if (
      values.accessLevel !== sails.config.custom.rolesEnums.VOTER &&
      values.accessLevel !== sails.config.custom.rolesEnums.CANDIDATE &&
      values.accessLevel !== sails.config.custom.rolesEnums.ADMIN
    ) {
      values.accessLevel = sails.config.custom.rolesEnums.VOTER;
    }
    next();
  },
};