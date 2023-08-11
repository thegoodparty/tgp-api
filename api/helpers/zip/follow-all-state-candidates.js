module.exports = {
  inputs: {
    state: {
      type: 'string',
      required: true,
    },
    userId: {
      type: 'number',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { state, userId } = inputs;
      const stateCandidates = await Candidate.find({ isActive: true, state });
      for (let i = 0; i < stateCandidates.length; i++) {
        const candidate = stateCandidates[i];
        const existingSupport = await Support.find({
          user: userId,
          candidate: candidate.id,
        });
        if (existingSupport.length === 0) {
          await Support.create({
            user: userId,
            candidate: candidate.id,
          });
        }
      }
      return exits.success('ok');
    } catch (e) {
      console.log('error in follow all state candidates', e);
      return exits.success('ok');
    }
  },
};
