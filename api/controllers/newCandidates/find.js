/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const request = require('request-promise');
const timeago = require('time-ago');

module.exports = {
  friendlyName: 'Find by id one Candidate',

  description: 'Find by id one Candidate ',

  inputs: {
    id: {
      type: 'string',
      required: true,
    },
    withImage: {
      type: 'boolean',
    },
    withIssues: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Candidate Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Candidate Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, withImage, withIssues } = inputs;
      const candidate = await Candidate.findOne({
        id,
        isActive: true,
      }).populate('candidateUpdates', {
        where: {
          status: 'accepted',
        },
      });
      if (!candidate) {
        return exits.notFound();
      }

      for (let i = 0; i < candidate.candidateUpdates.length; i++) {
        const update = candidate.candidateUpdates[i];
        const timeAgo = timeago.ago(new Date(update.date));
        update.timeAgo = timeAgo;
      }

      let candidateData = JSON.parse(candidate.data);
      candidateData.updatesList = candidate.candidateUpdates;

      let topIssues = [];

      if (withIssues) {
        const candidateIssues = await CandidateIssue.findOne({ candidate: id });
        const issueTopics = await IssueTopic.find();
        const topicsHash = {};
        issueTopics.forEach(topic => {
          topicsHash[topic.id] = topic;
        });
        if (candidateIssues) {
          const { data } = candidateIssues;
          data.forEach(issue => {
            const topic = topicsHash[issue.topicId];
            issue.topic = topic.topic;
            topic.positions.forEach(position => {
              if (position.id === issue.positionId) {
                issue.candidatePosition = position.name;
              }
            });
          });
          topIssues = data;
        }
      }

      return exits.success({
        candidate: candidateData,
        // imageAsBase64,
        topIssues,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};
