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
    openSecretsId: {
      type: 'string',
      required: true,
      unique: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    state: {
      type: 'string',
    },
    chamber: {
      type: 'string',
      required: true,
    },
    district: {
      type: 'number',
    },
    image: {
      type: 'string',
    },
    raised: {
      type: 'number',
    },
    smallContributions: {
      type: 'number',
    },
    reportDate: {
      type: 'string',
    },
    isActive: {
      type: 'boolean',
    },
    isApproved: {
      type: 'boolean',
    },
    isCertified: {
      type: 'boolean',
    },
  },
  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['createdAt', 'updatedAt']);
  },
};
