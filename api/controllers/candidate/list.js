// used for sitemaps.
const slugify = require('slugify');
const moment = require('moment');

module.exports = {
  inputs: {
    state: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
    notFound: {
      description: 'Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { state } = inputs;
      let candidates = await BallotCandidate.find({
        select: ['firstName', 'lastName', 'positionName'],
        where: {
          and: [
            { state: state.toUpperCase() },
            { party: { '!=': 'Republican' } },
            { party: { '!=': 'Democratic' } },
            { party: { '!=': 'Democratic-Farmer-Labor' } },
            { raceId: { '!=': '' } },
            { raceId: { '!=': null } },
            { electionDay: { '!=': '' } },
            { brCandidateId: { '!=': '' } },
            { isRemoved: false },
          ],
        },
      });
      let slugs = [];
      const now = moment();

      for (let candidate of candidates) {
        const electionDay = moment(candidate.electionDay);

        // Only include candidates whose election is either upcoming or within the past week
        if (electionDay.isAfter(now.subtract(7, 'days'))) {
          const slug = `${slugify(
            `${candidate.firstName}-${candidate.lastName}`,
            { lower: true },
          )}/${slugify(candidate.positionName, { lower: true })}`;
          slugs.push(slug);
        }
      }

      return exits.success({
        candidates: slugs,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.forbidden();
    }
  },
};
