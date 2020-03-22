/**
 * incumbents/to-scrape.js
 *
 * @description :: List of all opensecret ids found when seeding combined occurred.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find all Incumbents to scrape',

  description:
    'FList of all opensecret ids found when seeding combined occurred',

  inputs: {},

  exits: {
    success: {
      description: 'Incumbents ids Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Incumbents Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const incumbents = await IncumbentToScrape.find();
      const incumbentsIds = [];
      incumbents.forEach(incumbent => {
        incumbentsIds.push(incumbent.openSecretsId);
      });

      return exits.success(incumbentsIds);
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
