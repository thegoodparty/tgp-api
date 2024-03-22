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
    data: {
      type: 'json',
    },

    status: {
      type: 'string',
      isIn: ['active', 'archived', 'completed'],
      defaultsTo: 'active',
    },

    campaign: {
      model: 'campaign',
    },

    // has many
    routes: {
      collection: 'doorKnockingRoute',
      via: 'dkCampaign',
    },
  },
};
