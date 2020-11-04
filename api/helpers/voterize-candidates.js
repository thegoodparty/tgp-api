module.exports = {
  friendlyName: 'All Candidates for Voterize',

  inputs: {},

  fn: async function(inputs, exits) {
    const presidential = await PresidentialCandidate.find({
      isActive: true,
      isHidden: false,
    }).sort([{ isIncumbent: 'DESC' }, { combinedRaised: 'DESC' }]);
    presidential.forEach(president => (president.chamber = 'Presidential'));

    const incumbents = await Incumbent.find({
      isActive: true,
      isHidden: false,
    }).sort([{ raised: 'DESC' }]);
    incumbents.forEach(incumbent => (incumbent.isIncumbent = true));

    const raceCand = await RaceCandidate.find({
      isActive: true,
      isHidden: false,
    }).sort([{ raised: 'DESC' }]);
    const candidates = [...presidential, ...incumbents, ...raceCand];
    for (let i = 0; i < candidates.length; i++) {
      const {
        id,
        chamber,
        state,
        district,
        name,
        party,
        isIncumbent,
        likelyVoters,
      } = candidates[i];
      // const votesNeeded = await sails.helpers.votesNeeded(chamber, state, district);
      const votesNeeded = await sails.helpers.votesNeeded(candidates[i]);
      candidates[i] = {
        id,
        chamber,
        state,
        district,
        name,
        party,
        isIncumbent,
        likelyVoters,
        votesNeeded,
      };
    }
    return exits.success({
      candidates,
    });
  },
};

const candidateLastName = candidate => {
  if (!candidate) {
    return '';
  }
  const nameArr = candidate.name ? candidate.name.split(' ') : [];

  return candidate.name ? nameArr[nameArr.length - 1] : '';
};
