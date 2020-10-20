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
      const users = await User.find();
      for (let i = 0; i < users.length; i++) {
        try {
          if (users[i].email) {
            await sails.helpers.addEmail(users[i].email, 'The Good Party');
          }
        } catch (e) {}
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
