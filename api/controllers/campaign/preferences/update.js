module.exports = {
  friendlyName: 'User supports a candidate',

  inputs: {
    candidateId: {
      required: true,
      type: 'number',
    },
    preferences: {
      type: 'json',
    },
  },

  exits: {
    success: {
      description: 'Updated',
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
      const { candidateId, preferences } = inputs;
      const { user } = this.req;

      const candidate = await Candidate.findOne({ id: candidateId });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }
      const data = JSON.parse(candidate.data);
      await Candidate.updateOne({ id: candidateId }).set({
        data: JSON.stringify({
          ...data,
          preferences,
        }),
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('error at campaign/preferences/update', e);
      return exits.badRequest({
        message: 'Error updating preferences',
        e,
      });
    }
  },
};
