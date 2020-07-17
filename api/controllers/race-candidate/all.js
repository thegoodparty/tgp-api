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
    withPresidential: {
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
      const { onlyNoData, withPresidential } = inputs;

      const where = { isActive: true };
      const select = [
        'id',
        'name',
        'chamber',
        'state',
        'district',
        'source',
        'twitter',
      ];
      if (onlyNoData) {
        where.source = null;
      }
      const incumbents = await Incumbent.find({
        where,
        select,
      });

      incumbents.forEach(incumbent => {
        incumbent.isIncumbent = true;
      });

      const candidates = await RaceCandidate.find({
        where,
        select,
      });

      let presidnetials = [];
      if (withPresidential) {
        presidnetials = await PresidentialCandidate.find({
          where,
          select: ['id', 'name', 'twitter', 'isIncumbent'],
        });
        presidnetials.forEach(cand => (cand.chamber = 'presidential'));
      }

      return exits.success({
        allCandidates: [...presidnetials, ...incumbents, ...candidates],
      });
    } catch (e) {
      console.log('Error in find race-cand by id', e);
      return exits.notFound();
    }
  },
};
