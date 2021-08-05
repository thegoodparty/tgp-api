/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Homepage Candidate',

  description: 'Homepage Candidate ',

  inputs: {},

  exits: {
    success: {
      description: 'Candidates Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Candidates Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const datastores = sails.config.datastores;

      console.log('datastores1', JSON.stringify(datastores));

      console.log('home candidates debug1');
      const candidates = await Candidate.find({
        isActive: true,
        isOnHomepage: true,
      }).limit(3);
      console.log('home candidates debug2', candidates);

      const homepageCandidates = [];
      for (let i = 0; i < candidates.length; i++) {
        console.log('home candidates debug2', i);
        const candidate = candidates[i];

        const data = JSON.parse(candidate.data);
        delete data.comparedCandidates;
        delete data.updates;
        delete data.updatesDates;
        const supporters = await Support.count({
          candidate: candidate.id,
        });

        data.supporters = supporters || 0;

        homepageCandidates.push(data);
      }
      console.log('home candidates debug4');

      return exits.success({
        homepageCandidates,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};
