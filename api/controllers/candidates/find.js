/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find by id one Presidential Candidates',

  description: 'Find by id one Presidential Candidates ',

  inputs: {
    id: {
      type: 'string',
      required: true,
    },
    chamber: {
      type: 'string',
      required: true,
    },
    isIncumbent: {
      type: 'boolean',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Presidential Candidate Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Presidential Candidate Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, chamber, isIncumbent } = inputs;
      let candidate;
      if (chamber === 'presidential') {
        candidate = await PresidentialCandidate.findOne({ id });
      } else {
        const upperChamber = chamber.charAt(0).toUpperCase() + chamber.slice(1);
        if (isIncumbent) {
          candidate = await Incumbent.findOne({
            id,
            chamber: upperChamber,
          });
          candidate.isIncumbent = true;
        } else {
          candidate = await RaceCandidate.findOne({
            id,
            chamber: upperChamber,
          });
        }
      }

      return exits.success({
        ...candidate,
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
