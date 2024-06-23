module.exports = {
  friendlyName: 'update candidate',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
    isVerified: {
      type: 'boolean',
      allowNull: true,
    },
    dateVerified: {
      type: 'string',
      columnType: 'date',
      allowNull: true,
    },
    tier: {
      type: 'string',
      allowNull: true,
      isIn: ['WIN', 'LOSE', 'TOSSUP'],
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
      const { slug, isVerified, isPro, didWin, tier } = inputs;
      const attributes = {};
      if (typeof isVerified !== 'undefined') {
        attributes.isVerified = isVerified;
        attributes.dateVerified = isVerified === null ? null : new Date();
      }
      if (typeof isPro !== 'undefined') {
        attributes.isPro = isPro;
      }
      if (typeof didWin !== 'undefined') {
        attributes.didWin = didWin;
      }
      if (typeof tier !== 'undefined') {
        attributes.tier = tier;
      }

      const updatedCampaign = await Campaign.updateOne({ slug }).set(
        attributes,
      );
      await sails.helpers.crm.updateCampaign(updatedCampaign);

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
