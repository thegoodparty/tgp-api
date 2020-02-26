/**
 * Incumbent.js
 *
 * @description :: presidential candidate entity.
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
    party: {
      type: 'string',
    },
    image: {
      type: 'string',
    },
    combinedRaised: {
      type: 'number',
    },
    largeContributions: {
      type: 'number',
    },
    smallContributions: {
      type: 'number',
    },
    selfFinancing: {
      type: 'number',
    },
    federalFunds: {
      type: 'number',
    },
    otherFunds: {
      type: 'number',
    },
    campaignReportDate: {
      type: 'string',
    },
    outsideReportDate: {
      type: 'string',
    },
    info: {
      type: 'string',
    },
  },
  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['createdAt', 'updatedAt']);
  },
};
