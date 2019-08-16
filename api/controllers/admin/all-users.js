module.exports = {
  friendlyName: 'All Users',

  description: 'admin call for getting all users',

  inputs: {},

  exits: {
    success: {
      description: 'All Users',
    },

    badRequest: {
      description: 'Error getting users',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const users = await User.find();

      return exits.success({
        users,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting users',
      });
    }
  },
};
