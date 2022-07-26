/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const request = require('request-promise');
const timeago = require('time-ago');
const moment = require('moment');

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
        }).populate('endorsements');
      } else {
        candidate = await Candidate.findOne({
          id,
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
        candidatePositions = await candidatePositionFinder(id);
        candidateData.endorsements = candidate.endorsements;
      }
      if (!candidateData.certifiedDate) {
        // we can remove this after all candidates were updated.
        const certifiedDate = moment(candidate.createdAt).format('MM/DD/YYYY');
        candidateData.certifiedDate = certifiedDate;
      }
      const followers = {};
      let feed = {};
      if (allFields) {
        const today = moment().format('YYYY-MM-DD');
        const name = `${candidateData.firstName} ${candidateData.lastName}`;
        const brand = await SocialBrand.findOne({ name });
        if (brand) {
          const currentFollowers = await SocialStat.find({
            socialBrand: brand.id,
            date: today,
          });

          const lastWeek = moment()
            .subtract(7, 'days')
            .format('YYYY-MM-DD');
          const lastWeekFollowers = await SocialStat.find({
            socialBrand: brand.id,
            date: lastWeek,
          });

          let totalFollowers = 0;
          currentFollowers.forEach(item => {
            totalFollowers += item.count;
          });

          let totalLastWeek = 0;
          lastWeekFollowers.forEach(item => {
            totalLastWeek += item.count;
          });

          console.log('total', totalFollowers);
          console.log('total last week', totalLastWeek);
          followers.thisWeek = totalFollowers;
          followers.lastWeek = totalLastWeek;
        }

        if (candidateData.pulsarSearchId) {
          feed = await sails.helpers.socialListening.searchResultsHelper(
            candidateData.pulsarSearchId,
            30,
            true,
            true,
            false,
            true,
          );
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

const candidatePositionFinder = async id => {
  return await CandidatePosition.find({ candidate: id })
    .sort([{ order: 'ASC' }])
    .populate('topIssue')
    .populate('position');
};
