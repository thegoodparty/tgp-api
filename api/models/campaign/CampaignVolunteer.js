module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    role: {
      type: 'string',
      isIn: ['volunteer', 'staff', 'candidate', 'manager'],
      required: true,
    },

    campaign: {
      model: 'campaign',
      required: true,
    },

    user: {
      model: 'user',
      required: true,
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
