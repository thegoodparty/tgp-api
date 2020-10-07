const cdThreshold = require('../../../data/cdThreshold');

module.exports = {
  friendlyName: 'Seed',

  description: 'seed role',

  inputs: {},

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const cands = await RaceCandidate.find();
      let counter = 0;
      for (let i = 0; i < cands.length; i++) {
        const candidate = cands[i];
        const { id, campaignWebsite, source } = candidate;
        if (
          campaignWebsite &&
          campaignWebsite.startsWith('https://ballotpedia.org/')
        ) {
          const newSource = campaignWebsite;
          const newWebsite = source;
          await RaceCandidates.updateOne({ id }).set({
            source: newSource,
            campaignWebsite: newWebsite,
          });
          counter++;
        }
      }
      return exits.success({
        message: `updated ${counter} out of ${cands.length}`,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error in temp task',
      });
    }
  },
};
