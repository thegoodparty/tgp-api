/**
 * ZipCode.js
 * Zip code
 *
 * @description :: Zip Code
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const cdThreshold = require('../../../data/cdThreshold');

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    zip: {
      type: 'string',
      required: true,
      description: 'zip code',
      example: '90210',
      unique: true,
    },
    primaryCity: {
      type: 'string',
      description: 'Primary City Associated with zip code',
      example: 'Beverly Hills',
    },
    primaryCounty: {
      type: 'string',
      description: 'Primary county associated with zip code',
      example: 'Los Angeles',
    },
    approxPct: {
      type: 'number',
      description: 'approximate percent of accuracy',
      example: 'Los Angeles',
    },
    stateShort: {
      type: 'string',
      example: 'ca',
    },
    stateLong: {
      type: 'string',
      example: 'California',
    },
    sequence: {
      type: 'number',
      description:
        'this will be one for the primary district, 2 for the secondary, etc.',
      example: 'Los Angeles',
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    // a zip has one district
    congressionalDistrict: {
      model: 'congressionalDistrict',
    },
  },

  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['createdAt', 'updatedAt']);
  },
};

