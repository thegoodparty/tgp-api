module.exports = {
  friendlyName: 'Goodness Helper',

  description:
    'determine if a candidate is good , not good enough or unknown (returns null)',

  inputs: {
    candidate: {
      type: 'json',
    },
    chamber: {
      type: 'string',
    },
    incumbentRaised: {
      type: 'number',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidate, chamber, incumbentRaised } = inputs;

      const chamberThresholds = {
        presidential: {
          totalThreshold: 50000000,
        },
        senate: {
          totalThreshold: 2000000,
        },
        house: {
          totalThreshold: 500000,
        },
      };

      let isGood = false;
      let isNotGood = false;
      const {
        combinedRaised,
        smallContributions,
        raised,
        isApproved,
        isCertified,
      } = candidate;
      const totalRaised = combinedRaised || raised;
      const largeDonorPerc = (totalRaised - smallContributions) / totalRaised;
      const raisedByIncumbent = incumbentRaised
        ? incumbentRaised
        : chamberThresholds[chamber].totalThreshold;

      if (isCertified) {
        return exits.success({ isGood: true });
      }

      if (totalRaised < raisedByIncumbent) {
        // small funding
        if (isApproved) {
          return exits.success({ isGood: true });
        }
        return exits.success({ isGood: null });
      }
      // large funding
      if (largeDonorPerc <= 0.5) {
        isGood = true;
      } else if (largeDonorPerc > 0.5) {
        isNotGood = true;
      }

      if (isGood) {
        return exits.success({ isGood: true });
      }
      if (isNotGood) {
        return exits.success({ isGood: false });
      }
      return exits.success({ isGood: null });
    } catch (e) {
      return exits.badRequest({
        message: 'Error evaluating goodness',
      });
    }
  },
};
