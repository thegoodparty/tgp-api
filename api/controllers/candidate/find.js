/**
 * candidate/create.js
 *
 * @description :: Create candidate and attach to user from token.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Check user',

  description: 'Return user from jwt',

  inputs: {
    id: {
      description: 'Candidate ID',
      type: 'number',
      required: true,
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
      const candidate = await Candidate.findOne({ id: inputs.id }).populate(
        'user',
      );
      if (!candidate) {
        return exits.notFound();
      }
      return exits.success({
        candidate,
      });
    } catch (e) {
      console.log(e);
      return exits.notFound();
    }
  },
};
