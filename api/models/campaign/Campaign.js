module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    slug: {
      type: 'string',
      required: true,
      unique: true,
    },
    isActive: {
      type: 'boolean',
    },
    data: {
      type: 'json',
    },

    user: {
      model: 'user',
    },

    campaignPlanVersions: {
      collection: 'campaignPlanVersion',
      via: 'campaign',
    },
  },

  customToJSON: function () {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['createdAt', 'updatedAt']);
  },
};
