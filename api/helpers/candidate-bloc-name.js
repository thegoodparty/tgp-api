module.exports = {
  friendlyName: 'Candidate Bloc Helper',

  inputs: {
    candidate: {
      type: 'json',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidate } = inputs;
      if (!candidate) {
        return exits.badRequest({ message: 'missing candidate' });
      }
      if (candidate.twitter) {
        return exits.success(
          `@${candidate.twitter
            .replace('https://www.twitter.com/', '')
            .replace('https://twitter.com/', '')}`,
        );
      }
      if (candidate.blocName) {
        return exits.success(`${candidate.blocName}`);
      }
      if (candidate.id < 0) {
        return exits.success('GoodBloc');
      }
      const lastName = candidateLastName(candidate);
      return exits.success(`${lastName}Bloc`);
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
