module.exports = {
  friendlyName: 'Update User Ranking',

  description: 'update chamber ranking for a logged in user.',

  inputs: {
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
      description: 'Sharing Tracked',
    },

    badRequest: {
      description: 'Error tracking sharing',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let user = this.req.user;
      const { candidateId, chamber, isIncumbent } = inputs;
      let { candidate } = await sails.helpers.candidateFinder(
        candidateId,
        chamber,
        isIncumbent,
      );
      const { id, shares } = candidate;
      if (chamber === 'presidential') {
        await PresidentialCandidate.updateOne({
          id,
        }).set({ shares: shares + 1 });
      } else if (isIncumbent) {
        candidate = await Incumbent.updateOne({
          id,
        }).set({ shares: shares + 1 });
        candidate.isIncumbent = true;
      } else {
        candidate = await RaceCandidate.updateOne({
          id,
        }).set({ shares: shares + 1 });
      }
      if (user) {
        await User.updateOne({
          id: user.id,
        }).set({ shares: user.shares + 1 });
      }

      return exits.success({
        shares: candidate.shares,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at user/ranking/rank-candidate',
        e,
      );
      return exits.badRequest({
        message: 'Error ranking candidate',
      });
    }
  },
};
