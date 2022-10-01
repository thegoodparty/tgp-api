module.exports = {
  friendlyName: 'User supports a candidate',

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
      description: 'Support created',
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
      });
      await sails.helpers.cacheHelper('clear', 'all');

      try {
        // await sails.helpers.updateTag(reqUser.email, candidateId, 'active');
        await sails.helpers.crm.associateUserCandidate(reqUser, candidate);
      } catch (e) {
        console.log('error updating crm', e);
      }

      try {
        await sails.helpers.crm.updateCandidate(candidate);
      } catch (e) {
        console.log('error trigger candidate update');
      }

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
