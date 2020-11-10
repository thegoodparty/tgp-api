module.exports = {
  friendlyName: 'Incumbent by district helper',

  inputs: {
    state: {
      type: 'string',
    },
    district: {
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Incumbent found',
    },
    badRequest: {
      description: 'Incumbent Not Found',
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
          isHidden: false,
        });
        if (!incumbent) {
          const raceCand = await RaceCandidate.find({
            state: lowerState,
            district,
            chamber: 'House',
            isActive: true,
            isHidden: false,
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
          isHidden: false,
        });
        if (!incumbent) {
          const raceCand = await RaceCandidate.find({
            state: lowerState,
            chamber: 'Senate',
            isActive: true,
            isHidden: false,
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
          isHidden: false,
        });
        delete incumbent.info;
      }

      return exits.success({
        incumbent,
      });
    } catch (e) {
      console.log('Error in find incumbent by district helper', e);
      await sails.helpers.errorLoggerHelper(
        `Error at incumbent by district helper. State: ${inputs.state}. District: ${inputs.district}`,
        e,
      );
      return exits.badRequest({});
    }
  },
};
