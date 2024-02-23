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
    hashId: {
      type: 'string',
      required: true,
      unique: true,
    },
    positionSlug: {
      type: 'string',
    },
    state: {
      type: 'string',
      required: true,
      maxLength: 2,
      minLength: 2,
    },

    electionDate: {
      type: 'number',
      description: 'A JS timestamp (epoch ms)',
      example: 1502844074211,
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
