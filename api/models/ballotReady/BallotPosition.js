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

    data: {
      type: 'json',
    },
    ballotElection: {
      model: 'ballotElection',
    },
    candidates: {
      collection: 'ballotCandidate',
      via: 'positions',
    },
  },
};
