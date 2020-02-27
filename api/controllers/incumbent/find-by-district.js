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
      required: true,
    },
    district: {
      type: 'string',
      required: true,
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
      const houseRep = await Incumbent.findOne({ state, district });
      const senateReps = await Incumbent.find({ state, chamber: 'Senate' });
      let houseIncumbent;
      if (houseRep) {
        const {
          totalRaised,
          largeDonorsPerc,
          largeDonorPerHour,
          isGood,
        } = await sails.helpers.incumbentHelper(houseRep);

        houseIncumbent = {
          ...houseRep,
          totalRaised,
          largeDonorsPerc,
          largeDonorPerHour,
          isGood,
          isIncumbent: true,
        };
      }

      const good = [];
      const notGood = [];
      for (let i = 0; i < senateReps.length; i++) {
        const rep = senateReps[i];
        const {
          totalRaised,
          largeDonorsPerc,
          largeDonorPerHour,
          isGood,
        } = await sails.helpers.incumbentHelper(rep);

        if (isGood) {
          good.push({
            ...rep,
            totalRaised,
            largeDonorsPerc,
            largeDonorPerHour,
            isGood,
            isIncumbent: true,
          });
        } else {
          notGood.push({
            ...rep,
            totalRaised,
            largeDonorsPerc,
            largeDonorPerHour,
            isGood,
            isIncumbent: true,
          });
        }
      }

      return exits.success({
        houseIncumbent,
        senateIncumbents: { good, notGood },
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
