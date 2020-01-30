/**
 * incumbents/all.js
 *
 * @description :: Find all incumbents.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find all Incumbents',

  description: 'Find all incumbents ',

  inputs: {},

  exits: {
    success: {
      description: 'Incumbents Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Incumbents Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const incumbents = await Incumbent.find();
      const calcIncumbents = [];
      incumbents.map(incumbent => {
        const totalRaised = incumbent.raised + incumbent.pacRaised;
        const largeDonorsPerc =
          (totalRaised - incumbent.smallContributions) / totalRaised;
        const hours = incumbent.chamber === 'House' ? 2000 : 10000;
        const largeDonorPerHour =
          (totalRaised - incumbent.smallContributions) / hours;
        calcIncumbents.push({
          ...incumbent,
          totalRaised,
          largeDonorsPerc,
          largeDonorPerHour,
        });
      });

      return exits.success({
        incumbents: calcIncumbents,
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
