/**
 * SenateDistrict.js
 * Senate District associated with a user's address
 *
 * @description :: Senate District associated with a user's address.
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
      description: 'Name of district',
      example: 'Alabama State Senate district 14',
      unique: true,
    },
    ocdDivisionId: {
      type: 'string',
      required: true,
      description:
        'The political division of the election. A unique ocd division id',
      example: 'ocd-division/country:us/state:al/sldu:14',
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
      via: 'senateDistrict',
    },

    // an election has one district (a district has many elecions)
    elections: {
      collection: 'election',
      via: 'senateDistrict',
    },
  },
  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['id', 'createdAt', 'updatedAt', 'state']);
  },

  beforeCreate: async function(values, next) {
    try {
      console.log('senate before create', values);
      const stateId = values.state;
      const state = await State.findOne({
        id: stateId,
      });

      const senateKey = state.shortName;
      const threshold = senateThreshold[senateKey];
      console.log('senate threshold', threshold);
      if (threshold) {
        values.writeInThreshold = threshold.writeInThreshold;
        values.writeInThresholdWithPresident =
          threshold.writeInThresholdWithPresident;
      } else {
        console.log('missing house threshold');
      }

      // calling the callback next() with an argument returns an error. Useful for canceling the entire operation if some criteria fails.
      return next();
    } catch (e) {
      return next(e);
    }
  },
};
