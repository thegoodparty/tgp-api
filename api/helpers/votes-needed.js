module.exports = {
  friendlyName: 'Votes Needed Helper',

  inputs: {
    chamber: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
    district: {
      type: 'string',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { chamber, state, district } = inputs;
      const lowerChamber = chamber.toLowerCase();
      let votesNeeded;
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
        const congDistrict = await CongDistrict.findOne({
          state: stateRecord.id,
          code: district,
        });
        if (congDistrict) {
          votesNeeded =
            Math.max(
              congDistrict.writeInThreshold,
              congDistrict.writeInThresholdWithPresident,
            ) + 1;
        }
      }
      return exits.success(votesNeeded);
    } catch (e) {
      return exits.badRequest({
        message: 'Error calculating candidate numbers',
      });
    }
  },
};

const candidateLastName = candidate => {
  if (!candidate) {
    return '';
  }
  const nameArr = candidate.name ? candidate.name.split(' ') : [];

  return candidate.name ? nameArr[nameArr.length - 1] : '';
};
