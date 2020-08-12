const cdThreshold = require('../../../data/cdThreshold');

module.exports = {
  friendlyName: 'Seed',

  description: 'seed role',

  inputs: {},

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const cds = await CongDistrict.find();
      for (let i = 0; i < cds.length; i++) {
        const cd = cds[i];

        const stateId = cd.state;
        const state = await State.findOne({
          id: stateId,
        });

        const cdKey = `${state.shortName}-${cd.code}`;
        const threshold = cdThreshold[cdKey];
        let writeInThreshold;
        let writeInThresholdWithPresident;
        if (threshold) {
          writeInThreshold = threshold.writeInThreshold;
          writeInThresholdWithPresident =
            threshold.writeInThresholdWithPresident;

          await CongDistrict.updateOne({ id: cd.id }).set({
            writeInThreshold,
            writeInThresholdWithPresident,
          });
        }
      }
      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error in temp task',
      });
    }
  },
};
