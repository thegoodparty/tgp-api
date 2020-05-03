module.exports = {
  friendlyName: 'All Candidates',

  description: 'admin call for getting all candidates',

  inputs: {
    id: {
      type: 'number',
    },
    updatedFields: {
      type: 'json',
    },
    chamber: {
      type: 'string',
    },
    isIncumbent: {
      type: 'boolean',
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
      const { id, updatedFields, chamber, isIncumbent } = inputs;
      console.log(id, updatedFields, chamber, isIncumbent);

      let candidate;
      if (chamber === 'presidential') {
        candidate = await PresidentialCandidate.updateOne({
          id,
        }).set(updatedFields);
      } else if (isIncumbent) {
        candidate = await Incumbent.updateOne({
          id,
        }).set(updatedFields);
      } else {
        candidate = await RaceCandidate.updateOne({
          id,
        }).set(updatedFields);
      }

      return exits.success({
        candidate,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};
