module.exports = {
  friendlyName: 'Remove user supports a candidate',

  inputs: {
    candidateId: {
      description: 'candidate id',
      example: 1,
      required: true,
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Support removed',
    },

    badRequest: {
      description: 'Error creating support',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let reqUser = this.req.user;
      const { candidateId } = inputs;

      await Support.destroyOne({
        user: reqUser.id,
        candidate: candidateId,
      });
      try {
        await sails.helpers.triggerCandidateUpdate(candidateId);
      } catch (e) {
        console.log('error trigger candidate update');
      }
      try {
        await sails.helpers.updateTag(
          reqUser.email,
          candidateId,
          'inactive',
        );
      } catch (e) {
        console.log('error remove tag');
      }

      try {
        const candidate = await Candidate.findOne({ id: candidateId });
        await sails.helpers.crm.tag(reqUser, candidate, true);
      } catch (e) {}
      return exits.success({
        message: 'support deleted',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error removing support',
      });
    }
  },
};
