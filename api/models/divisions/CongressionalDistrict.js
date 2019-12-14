/**
 * CongressionalDistrict.js
 * Congressional District associated with a user's address
 *
 * @description :: Congressional District associated with a user's address.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const cdThreshold = require('../../../data/cdThreshold');

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    name: {
      type: 'string',
      required: true,
      description: 'Name of district',
      example: "California's 29th congressional district",
      unique: true,
    },
    ocdDivisionId: {
      type: 'string',
      required: true,
      description:
        'The political division of the election. A unique ocd division id',
      example: 'ocd-division/country:us/state:al/cd:6',
      unique: true,
    },
    code: {
      type: 'number',
      required: true,
      description: 'District code',
      example: '29',
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

    // a district has one state
    state: {
      model: 'state',
    },

    // a user has one district (a district has many users)
    users: {
      collection: 'user',
      via: 'congressionalDistrict',
    },
    // a candidate has one district (a district has many users)
    candidates: {
      collection: 'candidate',
      via: 'congressionalDistrict',
    },

    // an election has one district (a district has many elections)
    elections: {
      collection: 'election',
      via: 'congressionalDistrict',
    },
  },

  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['createdAt', 'updatedAt', 'state']);
  },

  beforeCreate: async function(values, next) {
    try {
      const stateId = values.state;
      const state = await State.findOne({
        id: stateId,
      });

      const cdKey = `${state.shortName}-${values.code}`;
      const threshold = cdThreshold[cdKey];
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
