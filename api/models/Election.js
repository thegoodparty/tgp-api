/**
 * State.js
 * District associated with a user's address
 *
 * @description :: District associated with a user's address.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    civicId: {
      type: 'string',
      required: true,
      description: 'Civic API id',
      example: '4856',
      unique: true,
    },
    name: {
      type: 'string',
      required: true,
      description: 'A displayable name for the election.',
      example: 'Alabama State House District 42 Special Primary Election',
    },
    electionDay: {
      type: 'string',
      required: true,
      description: 'Day of the election in YYYY-MM-DD format.',
      example: '2019-08-20',
    },
    ocdDivisionId: {
      type: 'string',
      required: true,
      description: 'The political division of the election',
      example: 'ocd-division/country:us/state:ca/cd:29',
    },

    rawResult: {
      type: 'string',
      description: 'JSON stringified version of the raw civic api result',
    },
    withPresidential: {
      type: 'boolean',
      defaultsTo: false,
      description:
        'Is presidential race in effect at the same time as this election?',
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    // an election has one district (of each type)
    congressionalDistrict: {
      model: 'congressionalDistrict',
    },

    houseDistrict: {
      model: 'houseDistrict',
    },

    senateDistrict: {
      model: 'senateDistrict',
    },

    // an election has one state
    state: {
      model: 'state',
    },
  },

  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['id', 'createdAt', 'updatedAt', 'rawResult']);
  },
};
