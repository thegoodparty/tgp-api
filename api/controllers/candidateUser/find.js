/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Find Candidate associated with user',

  inputs: {},

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
      const user = this.req.user;
      if (!user.candidate) {
        return exits.notFound();
      }
      const candidate = await Candidate.findOne({
        id: user.candidate,
      }).populate('candidateUpdates');
      if (!candidate) {
        return exits.notFound();
      }
      let candidateData = JSON.parse(candidate.data);
      candidateData.updatesList = candidate.candidateUpdates;
      return exits.success({
        candidate: candidateData,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};
