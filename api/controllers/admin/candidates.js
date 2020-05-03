module.exports = {
  friendlyName: 'All Candidates',

  description: 'admin call for getting all candidates',

  inputs: {
    chamber: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error getting candidates',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { chamber } = inputs;
      let candidates;
      if (chamber === 'presidential') {
        candidates = await PresidentialCandidate.find({
          isActive: true,
        }).sort([{ isIncumbent: 'DESC' }, { combinedRaised: 'DESC' }]);
      } else {
        const incumbents = await Incumbent.find({
          isActive: true,
        }).sort([{ raised: 'DESC' }]);
        const raceCand = await RaceCandidate.find({
          isActive: true,
        }).sort([{ raised: 'DESC' }]);

        candidates = [...incumbents, ...raceCand];
      }

      return exits.success({
        candidates,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};
