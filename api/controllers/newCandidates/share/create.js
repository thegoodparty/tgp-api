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
      let reqUser = this.req.user;
      const { candidateId } = inputs;
      const candidate = await Candidate.findOne({
        id: candidateId,
        isActive: true,
      });
      if (!candidate) {
        return exits.badRequest('no candidate found');
      }
      // first make sure the user doesn't have a share already.
      const existingShare = await ShareCandidate.find({
        user: reqUser.id,
        candidate: candidateId,
      });
      if (existingShare.length > 0) {
        return exits.success({
          message: 'ok',
        });
      }
      await ShareCandidate.create({
        user: reqUser.id,
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
