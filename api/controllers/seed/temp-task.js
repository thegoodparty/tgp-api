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
      const users = await User.find().populate('crew');
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        await User.updateOne({ id: user.id }).set({
          crewCount: user.crew.length + 1,
        });
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
