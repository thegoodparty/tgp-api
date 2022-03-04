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
    withSimilar: {
      type: 'boolean',
    },
    withIssues: {
      type: 'boolean',
    },
    withEndorsements: {
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
      const { id, withSimilar, withIssues, withEndorsements } = inputs;
      let candidate;
      if (withEndorsements) {
        candidate = await Candidate.findOne({
          id,
          isActive: true,
        })
          .populate('candidateUpdates', {
            where: {
              status: 'accepted',
            },
          })
          .populate('endorsements');
      } else {
        candidate = await Candidate.findOne({
          id,
          isActive: true,
        }).populate('candidateUpdates', {
          where: {
            status: 'accepted',
          },
        });
      }
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
      let similarCampaigns = [];

      if (withIssues) {
        topIssues = await issueFinder(id);
      }

      if (withSimilar) {
        similarCampaigns = await similarFinder(id, topIssues);
      }

      if (withEndorsements) {
        candidateData.endorsements = candidate.endorsements;
      }

      return exits.success({
        candidate: candidateData,
        topIssues,
        similarCampaigns,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};

const issueFinder = async id => {
  const issues = await CandidateIssueItem.find({ candidate: id }).populate(
    'topic',
  );

  issues.forEach(issue => {
    const { topic } = issue;
    if (topic.positions) {
      topic.positions.forEach(position => {
        if (position.id === issue.positionId) {
          issue.candidatePosition = position.name;
        }
      });
      issue.topic = topic.topic;
    }
  });
  return issues;
};

const similarFinder = async (id, topIssues) => {
  const similar = [];
  // for (let i = 0; i < topIssues.length; i++) {
  //   const issue = topIssues[i];
  //   const topic = await IssueTopic.find({ id: issue.topicId });
  // }
  return similar;
};
