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

    electionDate: {
      type: 'number',
      required: true,
    },
    state: {
      type: 'string',
      required: true,
    },

    data: {
      type: 'json',
    },

    ballotPositions: {
      collection: 'ballotPosition',
      via: 'ballotElection',
    },
    candidates: {
      collection: 'ballotCandidate',
      via: 'elections',
    },
  },
};
