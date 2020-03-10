module.exports = {
  friendlyName: 'Incumbent Helper',

  inputs: {
    incumbent: {
      type: 'json',
    },

    chamber: {
      type: 'string',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { incumbent, chamber } = inputs;
      const totalRaised = incumbent.raised + incumbent.pacRaised;
      const largeDonorsPerc =
        (totalRaised - incumbent.smallContributions) / totalRaised;
      const hours = incumbent.chamber === 'House' ? 2000 : 10000;
      const largeDonorPerHour =
        (totalRaised - incumbent.smallContributions) / hours;
      let isGood = false;
      if (
        (chamber === 'Senate' && totalRaised < 2000000) ||
        (chamber === 'House' && totalRaised < 500000) ||
        largeDonorsPerc < 0.5
      ) {
        isGood = true;
      }

      return exits.success({
        totalRaised,
        largeDonorsPerc,
        largeDonorPerHour,
        isGood,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error calculating incumbent numbers',
      });
    }
  },
};
