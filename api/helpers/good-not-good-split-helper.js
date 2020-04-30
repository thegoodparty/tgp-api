module.exports = {
  friendlyName: 'Goodness Helper',

  description:
    'determine if a candidate is good , not good enough or unknown (returns null)',

  inputs: {
    candidates: {
      type: 'json',
    },
    chamber: {
      type: 'string',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidates, chamber } = inputs;

      const good = [];
      const notGood = [];
      const unknown = [];
      const incumbentRaised = findIncumbentRaised(candidates);
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const { isGood } = await sails.helpers.goodnessHelper(
          candidate,
          chamber,
          incumbentRaised,
        );
        if (isGood === true) {
          good.push({
            ...candidate,
            isGood,
          });
        } else if (isGood === false) {
          notGood.push({
            ...candidate,
            isGood,
          });
        } else {
          unknown.push({
            ...candidate,
            isGood,
          });
        }
      }

      return exits.success({
        candidates: {
          good,
          notGood,
          unknown,
        },
      });
    } catch (e) {
      return exits.badRequest({
        message: 'Error evaluating goodness',
      });
    }
  },
};

const findIncumbentRaised = candidates => {
  let maxRaised = 0;
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i].isIncumbent) {
      return candidates[i].raised * 0.5;
    }
    maxRaised = Math.max(maxRaised, candidates[i].raised);
  }
  return maxRaised / 2;
};
