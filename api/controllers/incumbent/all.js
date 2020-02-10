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
      for (let i = 0; i < incumbents.length; i++) {
        const incumbent = incumbents[i];
        const {
          totalRaised,
          largeDonorsPerc,
          largeDonorPerHour,
        } = await sails.helpers.incumbentHelper(incumbent);

        calcIncumbents.push({
          ...incumbent,
          totalRaised,
          largeDonorsPerc,
          largeDonorPerHour,
        });
      }

      return exits.success({
        incumbents: calcIncumbents,
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
