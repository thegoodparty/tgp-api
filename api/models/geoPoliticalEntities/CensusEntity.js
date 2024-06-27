// mapping of mtfcc and geo id to state and name (can be used to get the county name and state from the geo id)
module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    mtfcc: {
      type: 'string',
      required: true,
    },

    mtfccType: {
      type: 'string',
      required: true,
    },

    geoId: {
      type: 'string',
      required: true,
    },

    name: {
      type: 'string',
      required: true,
    },

    state: {
      type: 'string',
      required: true,
    },
  },
};
