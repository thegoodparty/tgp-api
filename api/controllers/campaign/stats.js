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
      type: 'number',
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
      const days = range === 30 ? 30 : 7;
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

      const followers = await sails.helpers.socialListening.candidateFollowersByDayHelper(
        candidate,
        days
      );

      const shares = await ShareCandidate.find({
        candidate: candidate.id,
        createdAt: { '>': new Date(startDate) },
      });

      const lastPeriodShares = await ShareCandidate.count({
        candidate: candidate.id,
        createdAt: { '<': new Date(startDate), '>': new Date(lastPeriod) },
      });

      // button impressions
      const impressions = await ButtonImpression.find({
        candidate: candidate.id,
        createdAt: { '>': new Date(startDate) },
        type: 'impression',
      });

      const lastPeriodImpressions = await ButtonImpression.count({
        candidate: candidate.id,
        createdAt: { '<': new Date(startDate), '>': new Date(lastPeriod) },
        type: 'impression',
      });

      // button clicks
      const clicks = await ButtonImpression.find({
        candidate: candidate.id,
        createdAt: { '>': new Date(startDate) },
        type: 'click',
      });

      const lastPeriodClicks = await ButtonImpression.count({
        candidate: candidate.id,
        createdAt: { '<': new Date(startDate), '>': new Date(lastPeriod) },
        type: 'clicks',
      });

      // totals

      // const totalEndorsers = await Support.count({
      //   candidate: candidate.id,
      // });
      // const totalVisits = await Visit.count({
      //   url,
      // });
      const totalImpressions = await ButtonImpression.count({
        candidate: candidate.id,
        type: 'impression',
      });
      const chart = groupByDate(
        visits,
        followers,
        shares,
        impressions,
        clicks,
        days,
      );
      return exits.success({
        stats: {
          visitors: {
            total: visits.length,
            lastPeriod: lastPeriodVisitCount,
          },
          followers: {
            total:
              followers.length > 0 ? followers[followers.length - 1].total : 0,
            lastPeriod: followers.length > 0 ? followers[0].total : 0,
          },
          shares: {
            total: shares.length,
            lastPeriod: lastPeriodShares,
          },
          impressions: {
            total: impressions.length,
            lastPeriod: lastPeriodImpressions,
          },
          clicks: {
            total: clicks.length,
            lastPeriod: lastPeriodClicks,
          },
        },
        chart,

        totals: {
          impressions: totalImpressions,
        },
      });
    } catch (e) {
      console.log('Error at campaign/stats', e);
      return exits.badRequest({ message: 'Error generating stats' });
    }
  },
};

const groupByDate = (visits, followers, shares, impressions, clicks, days) => {
  const byDates = {};
  // const startDate = moment()
  //   .subtract(days, 'days')
  //   .format('M-D');
  for (let i = 0; i < days; i++) {
    const date = moment()
      .subtract(days - i - 1, 'days')
      .format('M-D');
    byDates[date] = {
      date,
      visits: 0,
      followers: 0,
      shares: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
    };
  }
  groupRecordsByDate(visits, 'visits', byDates);
  groupRecordsByDate(shares, 'shares', byDates);
  groupRecordsByDate(impressions, 'impressions', byDates);
  groupRecordsByDate(clicks, 'clicks', byDates);
  ctrByDate(clicks, impressions, byDates);
  groupFollowersByDate(followers, byDates);
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
        followers: 0,
        shares: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
      };
    }
    byDates[date][key]++;
  });
};

const ctrByDate = (clicks, impressions, byDates) => {
  impressions.forEach(impression => {
    const date = moment(impression.createdAt).format('M-D');
    const { clicks, impressions } = byDates[date];
    if (impressions !== 0) {
      byDates[date]['ctr'] = (clicks * 100) / impressions;
    }
  });
};

const groupFollowersByDate = (followers, byDates) => {
  followers.forEach(follow => {
    if (follow) {
      byDates[follow.date]['followers'] = follow.total;
    }
  });
};
