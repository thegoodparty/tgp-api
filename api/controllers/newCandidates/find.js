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
    allFields: {
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
      const { id, allFields, withImage } = inputs;
      let candidate;
      if (allFields) {
        candidate = await Candidate.findOne({
          id,
          isActive: true,
        })
          .populate('candidateUpdates')
          .populate('endorsements');
      } else {
        candidate = await Candidate.findOne({
          id,
          isActive: true,
        }).populate('candidateUpdates');
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
      candidateData.updatesList.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      let imageAsBase64;
      if (withImage && candidateData.image) {
        const imageData = await request.get(candidateData.image, { encoding: null });
        imageAsBase64 = Buffer.from(imageData).toString('base64');
      }
      let candidatePositions = [];
      let similarCampaigns = [];

      if (allFields) {
        candidatePositions = await candidatePositionFinder(id);
        similarCampaigns = await similarFinder(id, candidatePositions);
        candidateData.endorsements = candidate.endorsements;
      }

      return exits.success({
        candidate: candidateData,
        candidatePositions,
        similarCampaigns,
        imageAsBase64
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};

const candidatePositionFinder = async id => {
  return await CandidatePosition.find({ candidate: id })
    .sort([{ order: 'ASC' }])
    .populate('topIssue')
    .populate('position');
};

const similarFinder = async (id, candidatePositions) => {
  const topicIds = candidatePositions.map(
    candPosition => candPosition.topIssue.id,
  );
  const candidates = await Candidate.find({
    id: { '!=': id },
  }).populate('topIssues', {
    where: {
      id: { in: topicIds },
    },
  });
  const sorted = [];
  candidates.forEach(candidate => {
    if (candidate.topIssues.length > 0) {
      const data = JSON.parse(candidate.data);
      const { firstName, lastName, race, party, id } = data;
      const similar = { firstName, lastName, race, party, id };
      sorted.push({
        // count: candidatesCount[key],
        candidate: similar,
        matchingIssues: candidate.topIssues,
      });
    }
  });
  sorted.sort((a, b) => {
    return b.matchingIssues.length - a.matchingIssues.length;
  });

  return sorted;
};
