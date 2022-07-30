/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const candidates = await Candidate.find({ isActive: true });
      for (let i = 0; i < candidates.length; i++) {
        const data = JSON.parse(candidates[i].data);
        data.isClaimed = true;
        await Candidate.updateOne({ id: candidates[i].id }).set({
          data: JSON.stringify(data),
        });
      }

      return exits.success({
        message: `Updated ${candidates.length} candidates`,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        error: JSON.stringify(e),
      });
    }
  },
};
