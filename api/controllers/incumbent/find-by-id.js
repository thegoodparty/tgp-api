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
    id: {
      description: 'Incumbent ID',
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
      const incumbent = await Incumbent.findOne({ openSecretsId: inputs.id });
      if (!incumbent) {
        return exits.notFound();
      }

      // const totalRaised = incumbent.raised + incumbent.pacRaised;
      // const largeDonorsPerc =
      //   (totalRaised - incumbent.smallContributions) / totalRaised;
      // const hours = incumbent.chamber === 'House' ? 2000 : 10000;
      // const largeDonorPerHour =
      //   (totalRaised - incumbent.smallContributions) / hours;
      console.log('here ************', incumbent.chamber)
      const {
        totalRaised,
        largeDonorsPerc,
        largeDonorPerHour,
      } = await sails.helpers.incumbentHelper(incumbent, incumbent.chamber);

      // new calculation

      return exits.success({
        ...incumbent,
        totalRaised,
        largeDonorsPerc,
        largeDonorPerHour,
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
