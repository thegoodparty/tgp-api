module.exports = {
  friendlyName: 'User shares a candidate',

  inputs: {
    candidateId: {
      description: 'candidate id to be supported',
      example: 1,
      required: true,
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Share created',
    },

    badRequest: {
      description: 'Error creating support',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { candidateId } = inputs;
      const candidate = await Candidate.findOne({
        id: candidateId,
        isActive: true,
      });
      if (!candidate) {
        return exits.badRequest('no candidate found');
      }

      await ShareCandidate.create({
        candidate: candidateId,
      });

      return exits.success({
        message: 'share created',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error supporting candidate',
      });
    }
  },
};
