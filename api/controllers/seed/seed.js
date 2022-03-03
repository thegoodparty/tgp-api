/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const mailchimp = require('@mailchimp/mailchimp_marketing');
const md5 = require('md5');
const apiKey = sails.config.custom.MAILCHIMP_API || sails.config.MAILCHIMP_API;
const server =
  sails.config.custom.MAILCHIMP_SERVER || sails.config.MAILCHIMP_SERVER;

mailchimp.setConfig({
  apiKey,
  server,
});
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      // console.log(await CandidateIssue.find({}));
      const oldCandidateIssueList = await CandidateIssue.find({});
      const allIssueTopics = await IssueTopic.find({});
      const issueTopicList = {};
      allIssueTopics.forEach(issueTopic => {
        issueTopicList[issueTopic.id] = issueTopic;
      });
      
      for (let i = 0; i < oldCandidateIssueList.length; i++) {
        const oldCandidateIssue = oldCandidateIssueList[i];
        for (let j = 0; j < oldCandidateIssueList[i].data.length; j++) {
          
          const item = oldCandidateIssue.data[j];
          const candidate = await Candidate.findOne({
            id: oldCandidateIssue.candidate,
          });
          
          const topic = issueTopicList[item.topicId];
          const candidateIssueItem = await CandidateIssueItem.findOrCreate(
            {
              topic: topic.id,
              candidate: candidate.id,
            },
            {
              candidate: candidate.id,
              topic: topic.id,
            },
          );
          await CandidateIssueItem.updateOne({
            id: candidateIssueItem.id,
          }).set({
            candidate: candidate.id,
            topic: topic.id,
            positionId: item.positionId,
            description: item.description,
            websiteUrl: item.websiteUrl,
            status: oldCandidateIssue.status,
          });
        }
      }
      return exits.success(oldCandidateIssueList);
    } catch (e) {
      console.log('Error in mailchimp seed', e);
      return exits.success({
        message: 'Error in mailchimp seed',
        error: JSON.stringify(e),
      });
    }
  },
};
