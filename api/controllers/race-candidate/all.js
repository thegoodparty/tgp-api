/**
 * incumbents/find-by-id.js
 *
 * @description :: Find incumbents by open source id.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find all candidates',

  description: 'Find all candidates',

  inputs: {
    onlyNoData: {
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
    badRequest: {
      description: 'Bad Request.',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { onlyNoData } = inputs;

      const where = { isActive: true };
      if (onlyNoData) {
        where.source = '';
      }
      const incumbents = await Incumbent.find({
        where,
        select: ['id', 'name', 'chamber'],
      });

      incumbents.forEach(incumbent => {
        incumbent.isIncumbent = true;
      });

      const candidates = await RaceCandidate.find({
        where,
        select: ['id', 'name', 'chamber'],
      });

      return exits.success({
        allCandidates: [...incumbents, ...candidates],
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
