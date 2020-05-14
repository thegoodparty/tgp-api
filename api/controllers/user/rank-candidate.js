module.exports = {
  friendlyName: 'Update User Ranking',

  description: 'update chamber ranking for a logged in user.',

  inputs: {
    rank: {
      description: 'rank position for the candidate',
      example: 1,
      required: true,
      type: 'number',
    },

    candidateId: {
      description: 'candidate id to be ranked',
      example: 1,
      required: true,
      type: 'number',
    },

    chamber: {
      description: 'Candidate chamber',
      example: 'presidential',
      required: true,
      type: 'string',
    },

    isIncumbent: {
      description: 'is the candidate an incumbent',
      example: false,
      required: false,
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Ranking created',
    },

    badRequest: {
      description: 'Error creating ranking',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const reqUser = this.req.user;
      const { rank, candidateId, chamber, isIncumbent } = inputs;
      // first make sure the user doesn't have that ranking already.

      const existingRanking = await Ranking.find({
        user: reqUser.id,
        chamber,
        candidate: candidateId,
        isIncumbent,
      });
      if (existingRanking.length > 0) {
        return exits.badRequest({
          message: 'User already ranked this candidate',
        });
      }

      await Ranking.create({
        user: reqUser.id,
        chamber,
        candidate: candidateId,
        rank,
      });

      const user = await User.findOne({ id: reqUser.id }).populate('rankings');
      const zipCode = await ZipCode.findOne({
        id: user.zipCode,
      }).populate('cds');
      user.zipCode = zipCode;

      return exits.success({
        user,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error saving address',
      });
    }
  },
};
