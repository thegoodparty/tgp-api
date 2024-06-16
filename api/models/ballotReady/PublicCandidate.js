module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    slug: {
      type: 'string',
      required: true,
      unique: true,
    },
    voterData: {
      type: 'json',
    },
    data: {
      // this will be used to cache data from ballotCandidate, ballotElection, ballotPosition and any other
      type: 'json',
    },

    ballotCandidates: {
      model: 'ballotCandidate',
      unique: true,
    },

    ballotRace: {
      model: 'ballotRace',
    },
  },
};
