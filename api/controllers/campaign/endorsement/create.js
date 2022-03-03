module.exports = {
  friendlyName: 'User supports a candidate',

  inputs: {
    candidateId: {
      required: true,
      type: 'number',
    },
    title: {
      type: 'string',
      required: true,
    },
    summary: {
      type: 'string',
      required: true,
    },
    link: {
      type: 'string',
    },
    image: {
      type: 'string',
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
      const { summary, link, candidateId, image, title } = inputs;
      const { user } = this.req;

      const candidate = await Candidate.findOne({ id: candidateId });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }
      await Endorsement.create({
        title,
        summary,
        link,
        image,
        candidate: candidateId,
      });

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('error at campaign/endorsement/create', e);
      return exits.badRequest({
        message: 'Error creating endorsement',
        e,
      });
    }
  },
};
