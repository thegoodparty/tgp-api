module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    ballotId: {
      // consider creating a unique sparse index in scripts/indexes.js
      // tomer has suggested making up a random unique ballotId instead
      type: 'string',
      required: true,
      unique: true,
    },
    ballotHashId: {
      type: 'string',
    },
    electionDate: {
      type: 'string',
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
  },
};
