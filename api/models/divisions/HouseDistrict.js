/**
 * HouseDistrict.js
 * House District associated with a user's address
 *
 * @description :: House District associated with a user's address.
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
      example: 'California Assembly district 46',
      unique: true,
    },
    ocdDivisionId: {
      type: 'string',
      required: true,
      description:
        'The political division of the election. A unique ocd division id',
      example: 'ocd-division/country:us/state:ca/sldl:46',
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
      via: 'houseDistrict',
    },

    // an election has one district (a district has many elecions)
    elections: {
      collection: 'election',
      via: 'houseDistrict',
    },
  },
  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['id', 'createdAt', 'updatedAt', 'state']);
  },
};
