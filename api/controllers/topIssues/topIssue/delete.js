module.exports = {
  friendlyName: 'deleted topIssue',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Deleted',
    },

    badRequest: {
      description: 'Error updating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id } = inputs;
      const issue = await TopIssue.findOne({ id })
        .populate('positions')
        .populate('candidates');

      for (let i = 0; i < issue.positions.length; i++) {
        const positionId = issue.positions[i].id;
        const position = await Position.findOne({ id: positionId }).populate(
          'candidates',
        );
        for (let j = 0; j < position.candidates.length; j++) {
          await Candidate.removeFromCollection(
            position.candidates[j].id,
            'positions',
            positionId,
          );
        }
        await CandidatePosition.destroy({
          position: positionId,
        });
        await Position.destroy({
          id: positionId,
        });
      }

      for (let i = 0; i < issue.candidates.length; i++) {
        await Candidate.removeFromCollection(
          issue.candidates[i].id,
          'topIssues',
          id,
        );
      }

      await TopIssue.destroyOne({ id });
      await sails.helpers.cacheHelper('clear', 'all');

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at topIssue/delete', e);
      return exits.badRequest({
        message: 'Error deleting issue topic',
        e,
      });
    }
  },
};
