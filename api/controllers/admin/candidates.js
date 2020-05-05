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
        let upperChamber = 'House';
        if (chamber === 'senate') {
          upperChamber = 'Senate';
        }
        const incumbents = await Incumbent.find({
          isActive: true,
          chamber: upperChamber,
        }).sort([{ raised: 'DESC' }]);
        const raceCand = await RaceCandidate.find({
          isActive: true,
          chamber: upperChamber,
        }).sort([{ raised: 'DESC' }]);
        incumbents.forEach(incumbent => (incumbent.isIncumbent = true));
        candidates = [...incumbents, ...raceCand];
      }

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const { state, district } = candidate || {};
        const incumbent = await sails.helpers.incumbentByDistrictHelper(
          state,
          district,
        );
        let incumbentRaised = 50000000;
        if (chamber !== 'presidential') {
          if (candidate.isIncumbent) {
            incumbentRaised = candidate.raised;
          } else {
            incumbentRaised = incumbent
              ? incumbent.raised || incumbent.combinedRaised
              : false;
            incumbentRaised = incumbentRaised ? incumbentRaised / 2 : false;
          }
        }

        const { isGood, isBigMoney } = await sails.helpers.goodnessHelper(
          candidate,
          chamber,
          incumbentRaised,
        );
        candidate.isGood = isGood;
        candidate.isBigMoney = isBigMoney;
        console.log(
          `Name: ${candidate.name}, isGood: ${isGood}, isBigMoney: ${isBigMoney}`,
        );
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
