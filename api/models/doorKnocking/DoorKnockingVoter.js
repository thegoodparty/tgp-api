module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    geoHash: {
      type: 'string',
    },

    zip: {
      type: 'string',
    },

    isCalculated: {
      type: 'boolean',
      defaultsTo: false,
    },

    // has one
    voter: {
      model: 'voter',
    },

    dkCampaign: {
      model: 'doorKnockingCampaign',
    },

    // campaign: {
    //   model: 'campaign',
    // },
  },
};
