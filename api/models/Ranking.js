/**
 * Ranking.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    rank: {
      type: 'number',
      required: true,
      description: 'user ranking',
      example: 1,
    },

    candidate: {
      type: 'number',
      required: true,
      description: 'candidate id. can be presidential, senate or house',
      example: 1,
    },

    chamber: {
      type: 'string',
      required: true,
      description:
        'chamber of the candidate. can be presidential, senate or house',
      example: 'presidential',
    },

    isIncumbent: {
      type: 'boolean',
      required: false,
      description: 'is the candidate incumbent',
      example: false,
    },

    userState: { // denormalized for performance
      type: 'string',
      required: true,
      description: 'denormalized user state ',
      example: 'ca',
    },

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    user: {
      model: 'user',
    },
  },

  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['createdAt', 'updatedAt']);
  },
};
