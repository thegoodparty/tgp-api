module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    ballotId: {
      type: 'string',
      required: true,
      unique: true,
    },
    state: {
      type: 'string',
      required: true,
      maxLength: 2,
      minLength: 2,
    },

    level: {
      type: 'string',
      required: true,
    },

    subAreaName: {
      type: 'string',
    },

    subAreaValue: {
      type: 'string',
    },

    isJudicial: {
      type: 'boolean',
    },

    isPrimary: {
      type: 'boolean',
    },

    data: {
      type: 'json',
    },

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    // belongs to (one to many)
    county: {
      model: 'county',
    },

    // belongs to (one to many)
    municipality: {
      model: 'municipality',
    },
  },
};
