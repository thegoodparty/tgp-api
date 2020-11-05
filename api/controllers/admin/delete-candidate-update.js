module.exports = {
  friendlyName: 'All Candidates',

  description: 'admin call for getting all candidates',

  inputs: {
    candidateId: {
      type: 'number',
      required: true,
    },
    updateId: {
      type: 'number',
      required: true,
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
      const { candidateId, updateId, chamber, isIncumbent } = inputs;

      if (chamber === 'presidential') {
        await PresidentialCandidate.removeFromCollection(
          candidateId,
          'presCandUpdates',
          updateId,
        );
      } else if (isIncumbent) {
        await Incumbent.removeFromCollection(
          candidateId,
          'incumbentUpdates',
          updateId,
        );
      } else {
        await RaceCandidate.removeFromCollection(
          candidateId,
          'raceCandUpdates',
          updateId,
        );
      }

      await CampaignUpdate.destroyOne({ id: updateId });

      await sails.helpers.cacheHelper(
        'delete',
        `cand-${candidateId}-${chamber}-${!!isIncumbent}`,
      );
      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at admin/delete-candidate-update',
        e,
      );
      return exits.badRequest({
        message: 'Error updating candidates',
      });
    }
  },
};
