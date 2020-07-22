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
      unique: true,
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
    smallContributions: {
      type: 'number',
    },
    isActive: {
      type: 'boolean',
      allowNull: true,
    },
    isHidden: {
      type: 'boolean',
      allowNull: false,
      defaultsTo: false
    },
    isApproved: {
      type: 'boolean',
      allowNull: true,
    },
    isAligned: {
      type: 'string',
      defaultsTo: 'unknown',
      isIn: ['unknown', 'yes', 'no'],
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
    twitterFollowers: {
      type: 'number',
      allowNull: true,
      defaultsTo: 0,
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
    blocName: {
      type: 'string',
      allowNull: true,
    },
  },

  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['createdAt', 'updatedAt', 'needsSecondPass']);
  },
};
