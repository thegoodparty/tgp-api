module.exports = {
  friendlyName: 'Candidate Helper',

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

  fn: async function(inputs, exits) {
    try {
      const { candidateId, chamber, isIncumbent } = inputs;
      let candidate;
      if (chamber === 'presidential') {
        candidate = await PresidentialCandidate.findOne({
          id: candidateId,
          isActive: true,
          isHidden: false,
        });
      } else if (isIncumbent) {
        candidate = await Incumbent.findOne({
          id: candidateId,
          isActive: true,
          isHidden: false,
        });
        if (candidate) {
          candidate.isIncumbent = true;
        }
      } else {
        candidate = await RaceCandidate.findOne({
          id: candidateId,
          isActive: true,
          isHidden: false,
        });
      }

      return exits.success({ candidate });
    } catch (e) {
      return exits.badRequest({
        message: 'Error calculating candidate numbers',
      });
    }
  },
};
