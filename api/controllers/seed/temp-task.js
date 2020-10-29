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

  fn: async function (inputs, exits) {
    try {
      const rankings = await Ranking.find()
      for (let i = 0; i < rankings.length; i++) {
        const { user, chamber, candidate, isIncumbent } = rankings[i];
        if (user) {
          const { email } = await User.findOne({
            id: user,
          });
          try {
            if (email) {
              console.log(email, chamber, candidate, isIncumbent);
              
              await sails.helpers.updateTag(
                email,
                'The Good Party',
                chamber,
                candidate,
                isIncumbent,
                'active'
              );
            }

          } catch (e) { }
        }

      }
      return exits.success({});
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error in temp task',
      });
    }
  },
};
