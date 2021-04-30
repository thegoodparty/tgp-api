/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  inputs: {
  },

  exits: {

  },

  fn: async function (inputs, exits) {
    try {
      let candidates = await Candidate.find();
      for (let i = 0; i < candidates.length; i++) {
        const data = JSON.parse(candidates[i].data);
        if (data.updates) {
          for (let j = 0; j < data.updates.length; j++) {
            let candidateUpdate = await CampaignUpdate.findOne({
              date: data.updatesDates[j],
              candidateId: candidates[i].id
            });
            if (!candidateUpdate) {
              const newCandidate = await CampaignUpdate.create({
                date: data.updatesDates[j],
                candidateId: candidates[i].id,
                text: data.updates[j]
              }).fetch();
              console.log(newCandidate)
            }
          }
        }
      }
      // console.log('Hello World')
      return exits.success(candidates);
    } catch (e) {
      console.log('Error in find candidate', e);
    }
  },
};
