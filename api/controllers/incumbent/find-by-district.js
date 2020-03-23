/**
 * incumbents/find-by-id.js
 *
 * @description :: Find incumbents by open source id.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find Incumbent by id',

  description: 'Find incumbents by open source id',

  inputs: {
    state: {
      type: 'string',
    },
    district: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Incumbent Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Incumbent Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { state, district } = inputs;
      let incumbent;
      if (state && district) {
        const lowerState = state.toLowerCase();
        incumbent = await Incumbent.findOne({
          state: lowerState,
          district,
          chamber: 'House',
          isActive: true,
        });
      } else if (state) {
        const lowerState = state.toLowerCase();
        incumbent = await Incumbent.findOne({
          state: lowerState,
          chamber: 'Senate',
          isActive: true,
        });
      } else {
        incumbent = await PresidentialCandidate.findOne({
          isIncumbent: true,
          isActive: true,
        });
        delete incumbent.info
      }

      return exits.success({
        incumbent,
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
