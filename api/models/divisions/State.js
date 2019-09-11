/**
 * State.js
 * State definition for a district. Has one to many relationships with district.
 *
 * @description :: State definition for a district. Has one to many relationships with district.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    name: {
      type: 'string',
      required: true,
      description: 'Long name of the state',
      example: 'California',
      maxLength: 20,
      unique: true,
    },

    shortName: {
      type: 'string',
      required: true,
      description: 'Short code for the state',
      example: 'ca',
      maxLength: 2,
      unique: true,
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    congressionalDistricts: {
      collection: 'congressionalDistrict',
      via: 'state',
    },

    houseDistricts: {
      collection: 'houseDistrict',
      via: 'state',
    },

    senateDistricts: {
      collection: 'senateDistrict',
      via: 'state',
    },

    elections: {
      collection: 'election',
      via: 'state',
    },

    candidates: {
      collection: 'candidate',
      via: 'state',
    },
  },
  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['id', 'createdAt', 'updatedAt']);
  },
};
