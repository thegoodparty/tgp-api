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
        if (!incumbent) {
          const raceCand = await RaceCandidate.find({
            state: lowerState,
            district,
            chamber: 'House',
            isActive: true,
          }).sort([{ raised: 'DESC' }]);
          incumbent = raceCand.length > 0 ? raceCand[0] : null;
          if (incumbent) {
            incumbent.isFakeIncumbent = true;
          }
        }
      } else if (state) {
        const lowerState = state.toLowerCase();
        incumbent = await Incumbent.findOne({
          state: lowerState,
          chamber: 'Senate',
          isActive: true,
        });
        if (!incumbent) {
          const raceCand = await RaceCandidate.find({
            state: lowerState,
            chamber: 'Senate',
            isActive: true,
          }).sort([{ raised: 'DESC' }]);
          incumbent = raceCand.length > 0 ? raceCand[0] : null;
          if (incumbent) {
            incumbent.isFakeIncumbent = true;
          }
        }
      } else {
        incumbent = await PresidentialCandidate.findOne({
          isIncumbent: true,
          isActive: true,
        });
        delete incumbent.info;
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
