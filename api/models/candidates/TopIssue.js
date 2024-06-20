module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    name: {
      type: 'string',
      required: true,
      unique: true,
    },

    icon: {
      type: 'string',
      allowNull: true,
    },

    positions: {
      collection: 'position',
      via: 'topIssue',
    },

    candidates: {
      collection: 'candidate',
      via: 'topIssues',
    },

    campaigns: {
      collection: 'campaign',
      via: 'topIssues',
    },
  },
};
