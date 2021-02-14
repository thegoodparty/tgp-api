module.exports = {
  friendlyName: 'User supports',

  inputs: {},

  exits: {
    success: {
      description: 'Supports found',
    },

    badRequest: {
      description: 'Error finding support',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let reqUser = this.req.user;
      // first make sure the user doesn't have that ranking already.
      const supports = await Support.find({
        user: reqUser.id,
      });

      return exits.success({
        supports,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error finding supports',
      });
    }
  },
};
