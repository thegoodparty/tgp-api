/**
 * State.js
 * State definition for a district. Has one to many relationships with district.
 *
 * @description :: State definition for a district. Has one to many relationships with district.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const senateThreshold = require('../../../data/senateThreshold');

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    name: {
      type: 'string',
      required: true,
      description: 'Long name of the state',
      example: 'California',
      maxLength: 20,
      unique: true,
    },

    shortName: {
      type: 'string',
      required: true,
      description: 'Short code for the state',
      example: 'ca',
      maxLength: 2,
      unique: true,
    },

    primaryElectionDate: {
      type: 'string',
      description: 'Short code for the state',
      example: '3/17/20',
    },

    writeInThreshold: {
      type: 'number',
      description:
        'Threshold to invoke write-in procedure without presidential run in effect',
      example: '100000',
    },
    writeInThresholdWithPresident: {
      type: 'number',
      description:
        'Threshold to invoke write-in procedure with presidential run in effect',
      example: '100000',
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    congDistricts: {
      collection: 'congDistrict',
      via: 'state',
    },

    senateDistricts: {
      collection: 'senateDistrict',
      via: 'state',
    },

  },
  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['id', 'createdAt', 'updatedAt']);
  },
  beforeCreate: async function(values, next) {
    try {
      const stateKey = values.shortName;
      const threshold = senateThreshold[stateKey];
      if (threshold) {
        values.writeInThreshold = threshold.writeInThreshold;
        values.writeInThresholdWithPresident =
          threshold.writeInThresholdWithPresident;
      } else {
        //console.log('missing house threshold');
      }

      // calling the callback next() with an argument returns an error. Useful for canceling the entire operation if some criteria fails.
      return next();
    } catch (e) {
      return next(e);
    }
  },
};
