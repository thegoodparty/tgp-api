/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const slugify = require('slugify');
const moment = require('moment');

module.exports = {
  friendlyName: 'Track Visit',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    range: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },
  async fn(inputs, exits) {
    try {
      const { user } = this.req;
      const { range, id } = inputs;
      const days = range === 'Last 30 days' ? 30 : 7;
      const startDate = moment()
        .subtract(days, 'days')
        .format('YYYY-MM-DD');

      const lastPeriod = moment()
        .subtract(days * 2, 'days')
        .format('YYYY-MM-DD');

      const candidate = await Candidate.findOne({ id });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess) {
        return exits.forbidden();
      }

      const name = slugify(`${candidate.firstName} ${candidate.lastName}`);
      const url = `/candidate/${name}/${candidate.id}`;

      const visits = await Visit.find({
        url,
        createdAt: { '>': new Date(startDate) },
      });

      const lastPeriodVisitCount = await Visit.count({
        url,
        createdAt: { '<': new Date(startDate), '>': new Date(lastPeriod) },
      });

      const endorsements = await Support.find({
        candidate: candidate.id,
        createdAt: { '>': new Date(startDate) },
      });

      const lastPeriodEndorsements = await Support.count({
        candidate: candidate.id,
        createdAt: { '<': new Date(startDate), '>': new Date(lastPeriod) },
      });

      const shares = await ShareCandidate.find({
        candidate: candidate.id,
        createdAt: { '>': new Date(startDate) },
      });

      const lastPeriodShares = await ShareCandidate.count({
        candidate: candidate.id,
        createdAt: { '<': new Date(startDate), '>': new Date(lastPeriod) },
      });

      // totals

      const totalEndorsers = await Support.count({
        candidate: candidate.id,
      });
      const totalVisits = await Visit.count({
        url,
      });
      const candidateData = JSON.parse(candidate.data);
      const chart = groupByDate(visits, endorsements, shares, days);
      return exits.success({
        stats: {
          visitors: {
            total: visits.length,
            lastPeriod: lastPeriodVisitCount,
          },
          endorsers: {
            total: endorsements.length,
            lastPeriod: lastPeriodEndorsements,
          },
          shares: {
            total: shares.length,
            lastPeriod: lastPeriodShares,
          },
        },
        chart,

        totals: {
          visits: totalVisits,
          endorsers: totalEndorsers,
          likelyVoters: candidateData.likelyVoters,
          unrepVoters: candidateData.unrepVoters,
          votesNeeded: candidateData.votesNeeded,
        },
      });
    } catch (e) {
      console.log('Error creating campaign updates', e);
      return exits.badRequest({ message: 'Error registering visit' });
    }
  },
};

const groupByDate = (visits, endorsements, shares, days) => {
  const byDates = {};
  const startDate = moment()
    .subtract(days, 'days')
    .format('M-D');
  for (let i = 0; i < days; i++) {
    const date = moment()
      .subtract(days - i - 1, 'days')
      .format('M-D');
    byDates[date] = {
      date,
      visits: 0,
      endorsements: 0,
      shares: 0,
    };
  }
  groupRecordsByDate(visits, 'visits', byDates);
  groupRecordsByDate(endorsements, 'endorsements', byDates);
  groupRecordsByDate(shares, 'shares', byDates);
  const datesArray = Object.keys(byDates).map(key => byDates[key]);
  return datesArray;
};

const groupRecordsByDate = (records, key, byDates) => {
  records.forEach(stat => {
    const date = moment(stat.createdAt).format('M-D');
    if (!byDates[date]) {
      byDates[date] = {
        date,
        visits: 0,
        endorsements: 0,
        shares: 0,
      };
    }
    byDates[date][key]++;
  });
};
