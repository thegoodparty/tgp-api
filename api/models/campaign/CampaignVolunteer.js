module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    role: {
      type: 'string',
      isIn: ['volunteer', 'staff'],
    },

    campaign: {
      model: 'campaign',
    },

    user: {
      model: 'user',
    },

    // has many
    routes: {
      collection: 'doorKnockingRoute',
      via: 'volunteer',
    },
  },
};
