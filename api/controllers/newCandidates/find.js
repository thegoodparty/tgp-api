/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const request = require('request-promise');
const moment = require('moment');

module.exports = {
  friendlyName: 'Find by slug one Candidate',

  description: 'Find by slug one Candidate ',

  inputs: {
    slug: {
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

  fn: async function (inputs, exits) {
    try {
      const { slug, allFields, withImage } = inputs;
      let candidate;
      if (allFields) {
        candidate = await Candidate.findOne({
          slug,
          isActive: true,
        }).populate('endorsements');
      } else {
        candidate = await Candidate.findOne({
          slug,
          isActive: true,
        });
      }
      if (!candidate) {
        return exits.notFound();
      }
      let candidateData = JSON.parse(candidate.data);

      let imageAsBase64;
      if (withImage && candidateData.image) {
        const imageData = await request.get(candidateData.image, {
          encoding: null,
        });
        imageAsBase64 = Buffer.from(imageData).toString('base64');
      }
      let candidatePositions = [];

      if (allFields) {
        candidatePositions = await candidatePositionFinder(candidate.id);
        candidateData.endorsements = candidate.endorsements;
      }
      if (!candidateData.certifiedDate) {
        // we can remove this after all candidates were updated.
        const certifiedDate = moment(candidate.createdAt).format('MM/DD/YYYY');
        candidateData.certifiedDate = certifiedDate;
      }
      let followers = {};
      let feed = {};
      if (allFields) {
        followers =
          await sails.helpers.socialListening.candidateFollowersHelper(
            candidate,
          );
        const support = await sails.helpers.support.supportByCandidate(
          candidate.id,
        );

        followers.thisWeek += support.thisWeek;
        followers.lastWeek += support.lastWeek;

        if (candidateData.pulsarSearchId) {
          try {
            feed = await sails.helpers.socialListening.searchResultsHelper(
              candidateData.pulsarSearchId,
              4,
              true,
              true,
              false,
              true,
            );
          } catch (e) {
            console.log('error generating feed', e);
          }
        }
      }

      return exits.success({
        candidate: candidateData,
        candidatePositions,
        imageAsBase64,
        followers,
        feed,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};

const candidatePositionFinder = async (id) => {
  return await CandidatePosition.find({ candidate: id })
    .sort([{ order: 'ASC' }])
    .populate('topIssue')
    .populate('position');
};
