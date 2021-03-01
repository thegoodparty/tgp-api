
module.exports = {
  friendlyName: 'User supports a candidate',

  inputs: {
    candidateId: {
      description: 'candidate id to be supported',
      example: 1,
      required: true,
      type: 'number',
    },
    message: {
      description: 'personal note from the user',
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Support created',
    },

    badRequest: {
      description: 'Error creating support',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let reqUser = this.req.user;
      const { candidateId, message } = inputs;
      // first make sure the user doesn't have that ranking already.
      const existingSupport = await Support.find({
        user: reqUser.id,
        candidate: candidateId,
      });
      if (existingSupport.length > 0) {
        return exits.badRequest({
          message: 'User already supports this candidate',
        });
      }
      await Support.create({
        user: reqUser.id,
        candidate: candidateId,
        message,
      });
      await sails.helpers.triggerCandidateUpdate(candidateId);
      return exits.success({
        message: 'support created',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error supporting candidate',
      });
    }
  },
};
