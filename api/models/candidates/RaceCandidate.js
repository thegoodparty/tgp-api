/**
 * Incumbent.js
 *
 * @description :: incumbent entity.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    uuid: {
      type: 'string',
      required: true,
      unique: true
    },
    name: {
      type: 'string',
      required: true,
    },
    state: {
      type: 'string',
    },
    district: {
      type: 'number',
    },
    chamber: {
      type: 'string',
    },
    party: {
      type: 'string',
    },
    image: {
      type: 'string',
    },
    raised: {
      type: 'number',
    },
    largeContributions: {
      type: 'number',
    },
    smallContributions: {
      type: 'number',
    },
    pac: {
      type: 'number',
    },
    selfFinancing: {
      type: 'number',
    },
    other: {
      type: 'number',
    },
  },
  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['createdAt', 'updatedAt']);
  },
};
