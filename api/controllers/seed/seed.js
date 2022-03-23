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
      const oldIssueTopic = await IssueTopic.find();
      let issueCount = 0;
      let positionCount = 0;
      for (let i = 0; i < oldIssueTopic.length; i++) {
        try {
          const { topic, positions } = oldIssueTopic[i];
          const topIssue = await TopIssue.create({
            name: topic,
          }).fetch();
          issueCount++;
          for (let j = 0; j < positions.length; j++) {
            await Position.create({
              name: positions[j].name,
              topIssue: topIssue.id,
            });
            positionCount++;
          }
        } catch (e) {
          console.log('error in loop ', i, oldIssueTopic[i], e);
        }
      }

      return exits.success({
        issueCount,
        positionCount,
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
