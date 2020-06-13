module.exports = {
  friendlyName: 'Seed',

  description: 'seed role',

  inputs: {},

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let candidates = await PresidentialCandidate.find();
      await addBloc(candidates, 'presidential');
      candidates = await Incumbent.find();
      await addBloc(candidates, 'incumbent');
      candidates = await RaceCandidate.find();
      await addBloc(candidates, '');
      return exits.success({
        seed: `Added Blocs`,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting candidates' + JSON.stringify(e),
      });
    }
  },
};

const addBloc = async (cands, type) => {
  for (let i = 0; i < cands.length; i++) {
    const candidate = cands[i];
    const blocName = candidateLastName(candidate) + 'Bloc';
    if (type === 'presidential') {
      await PresidentialCandidate.updateOne({ id: candidate.id }).set({
        blocName,
      });
    } else if (type === 'incumbent') {
      await Incumbent.updateOne({ id: candidate.id }).set({
        blocName,
      });
    } else {
      await RaceCandidate.updateOne({ id: candidate.id }).set({
        blocName,
      });
    }
  }
};

const candidateLastName = candidate => {
  if (!candidate) {
    return '';
  }
  const nameArr = candidate.name ? candidate.name.split(' ') : [];

  return candidate.name ? nameArr[nameArr.length - 1] : '';
};
