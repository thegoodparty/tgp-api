// connect campaigns and candidates
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const candidates = await BallotCandidate.find({
        select: ['id', 'email'],
        where: {
          and: [
            { party: { '!=': 'Republican' } },
            { party: { '!=': 'Democratic' } },
            { p2vData: { '!=': null } },
            { email: { '!=': '' } },
          ],
        },
      }).limit(10);
      for (let i = 0; i < candidates.length; i++) {
        await sails.helpers.slack.errorLoggerHelper(
          'Trying to update candidate',
          candidates[i],
        );
        console.log('Trying to update candidate', candidates[i]);
        await sails.helpers.crm.updateCandidate(candidates[i]);
      }
      return exits.success({
        message: 'updated',
        total: candidates.length,
      });
    } catch (e) {
      console.log('Error in seed', e);
      await sails.helpers.slack.errorLoggerHelper('Error at seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};
