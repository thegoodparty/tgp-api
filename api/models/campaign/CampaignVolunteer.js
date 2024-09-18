module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    role: {
      type: 'string',
      isIn: ['volunteer', 'staff', 'candidate', 'manager'],
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

    // one to many
    surveys: {
      collection: 'survey',
      via: 'volunteer',
    },
  },
};
