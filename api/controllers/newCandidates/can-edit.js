module.exports = {
  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Created',
    },

    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  async fn(inputs, exits) {
    try {
      const { user } = this.req;
      const { slug } = inputs;
      const candidate = await Candidate.findOne({
        slug,
      });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);

      return exits.success(canAccess);
    } catch (e) {
      console.log('error at issue newCandidates/can-edit', e);
      return exits.badRequest({
        message: 'Error at can-edit',
        e,
      });
    }
  },
};
