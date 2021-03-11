module.exports = {
  friendlyName: 'User supports',

  inputs: {
    withCandidates: {
      type: 'boolean',
    },
  },

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
      const { withCandidates } = inputs;
      let reqUser = this.req.user;
      // first make sure the user doesn't have that ranking already.
      const supports = await Support.find({
        user: reqUser.id,
      });

      if (withCandidates) {
        for (let i = 0; i < supports.length; i++) {
          const candidate = await Candidate.findOne({
            id: supports[i].candidate,
          });
          supports[i].candidate = candidate;
        }
      }

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
