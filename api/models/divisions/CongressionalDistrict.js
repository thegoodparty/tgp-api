/**
 * CongressionalDistrict.js
 * Congressional District associated with a user's address
 *
 * @description :: Congressional District associated with a user's address.
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
      description: 'Name of district',
      example: "California's 29th congressional district",
      unique: true,
    },
    ocdDivisionId: {
      type: 'string',
      required: true,
      description:
        'The political division of the election. A unique ocd division id',
      example: 'ocd-division/country:us/state:al/cd:6',
      unique: true,
    },
    code: {
      type: 'number',
      required: true,
      description: 'District code',
      example: '29',
      unique: true,
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    // a district has one state
    state: {
      model: 'state',
    },

    // a user has one district (a district has many users)
    users: {
      collection: 'user',
      via: 'congressionalDistrict',
    },

    // an election has one district (a district has many elections)
    elections: {
      collection: 'election',
      via: 'congressionalDistrict',
    },
  },

  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['id', 'createdAt', 'updatedAt', 'state']);
  },
};
