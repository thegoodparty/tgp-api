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
