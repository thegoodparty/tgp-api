module.exports = {
  friendlyName: 'update candidate',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
    isVerified: {
      type: 'boolean',
      defaultsTo: null,
      allowNull: true
    },
    isPro: {
      type: 'boolean',
    },
    didWin: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Updated',
    },

    badRequest: {
      description: 'Error updating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { slug, isVerified, isPro, didWin } = inputs;
      const attributes = {};
      if (typeof isVerified !== 'undefined') {
        attributes.isVerified = isVerified;
      }
      if (typeof isPro !== 'undefined') {
        attributes.isPro = isPro;
      }
      if (typeof didWin !== 'undefined') {
        attributes.didWin = didWin;
      }

      await Campaign.updateOne({ slug }).set(attributes);

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('error at onboarding/admin-update', e);
      return exits.badRequest({
        message: 'Error updating campaign',
        e,
      });
    }
  },
};
