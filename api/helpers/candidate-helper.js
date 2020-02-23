module.exports = {
  friendlyName: 'Candidate Helper',

  inputs: {
    candidate: {
      type: 'json',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidate } = inputs;

      const totalRaised = candidate.raised;
      const largeDonorsPerc =
        (totalRaised - candidate.smallContributions) / totalRaised;

      return exits.success({ totalRaised, largeDonorsPerc });
    } catch (e) {
      return exits.badRequest({
        message: 'Error calculating candidate numbers',
      });
    }
  },
};
