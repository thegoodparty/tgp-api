module.exports = {
  friendlyName: 'Votes Needed Helper',

  inputs: {
    candidate: {
      type: 'json',
      required: true,
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidate } = inputs;
      const { chamber, state, district, votesReceived } = candidate;
      const lowerChamber = chamber ? chamber.toLowerCase() : 'presidential';
      if (votesReceived && votesReceived !== 0) {
        let candidates = [];
        if (lowerChamber === 'presidential') {
          candidates = await PresidentialCandidate.find({
            isActive: true,
            isHidden: false,
          }).sort([{ votesReceived: 'DESC' }]);
        } else {
          const raceCand = await RaceCandidate.find({
            chamber,
            state,
            district,
            isActive: true,
            isHidden: false,
          }).sort([{ votesReceived: 'DESC' }]);

          const incumbents = await Incumbent.find({
            chamber,
            state,
            district,
            isActive: true,
            isHidden: false,
          }).sort([{ votesReceived: 'DESC' }]);
          candidates = [...raceCand, ...incumbents].sort(
            (a, b) => b.votesReceived < a.votesReceived,
          );
        }
        if (candidates.length === 1) {
          return exits.success(candidates[0].votesReceived);
        } else if (candidates.length > 1) {
          // if our candidate is first place, votes needed are the second place plus 1
          if (
            candidates[0].id === candidate.id &&
            candidates[0].votesReceived === candidate.votesReceived
          ) {
            return exits.success(candidates[1].votesReceived);
          }
          // if our candidate is not at first place, votes needed are the first place plus 1
          return exits.success(candidates[0].votesReceived);
        }
        return exits.success(0);
      } else {
        // old logic
        let votesNeeded = 0;
        if (lowerChamber === 'presidential') {
          votesNeeded = 38658139;
        } else if (lowerChamber === 'senate') {
          const stateRecord = await State.findOne({ shortName: state });
          if (stateRecord) {
            votesNeeded =
              Math.max(
                stateRecord.writeInThreshold,
                stateRecord.writeInThresholdWithPresident,
              ) + 1;
          }
        } else {
          const stateRecord = await State.findOne({ shortName: state });
          let congDistrict;
          if (stateRecord) {
            congDistrict = await CongDistrict.findOne({
              state: stateRecord.id,
              code: district,
            });
          }
          if (congDistrict) {
            votesNeeded =
              Math.max(
                congDistrict.writeInThreshold,
                congDistrict.writeInThresholdWithPresident,
              ) + 1;
          }
        }
        return exits.success(votesNeeded);
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
};
