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
      const { id } = inputs;
      const candidate = await PresidentialCandidate.findOne({ id });


      return exits.success({
        ...candidate,
      });
    } catch (e) {
      console.log('Error in find presidnetial by id', e);
      return exits.notFound();
    }
  },
};
