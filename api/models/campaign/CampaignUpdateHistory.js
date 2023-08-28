module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    type: {
      type: 'string',
      isIn: ['doorKnocking', 'calls', 'digital'],
      required: true,
    },
    quantity: {
      type: 'number',
      required: true,
    },

    user: {
      model: 'user',
      required: true,
    },

    campaign: {
      model: 'campaign',
      required: true,
    },
  },
};
