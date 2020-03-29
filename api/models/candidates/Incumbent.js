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
    party: {
      type: 'string',
    },
    smallContributions: {
      type: 'number',
    },
    reportDate: {
      type: 'string',
    },
    isActive: {
      type: 'boolean',
      allowNull: true,
    },
    isApproved: {
      type: 'boolean',
      allowNull: true,
    },
    isCertified: {
      type: 'boolean',
      allowNull: true,
    },
    facebook: {
      type: 'string',
      allowNull: true,
    },
    twitter: {
      type: 'string',
      allowNull: true,
    },
    website: {
      type: 'string',
      allowNull: true,
    },
    info: {
      type: 'string',
      allowNull: true,
    },
    campaignWebsite: {
      type: 'string',
      allowNull: true,
    },
    source: {
      type: 'string',
      allowNull: true,
    },
    needsSecondPass: {
      type: 'boolean',
      allowNull: true,
    },
  },
  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['createdAt', 'updatedAt', 'needsSecondPass']);
  },
};
