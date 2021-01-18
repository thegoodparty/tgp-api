/**
 * CampaignUpdate.js
 *
 * @description :: campaign update - many to many relationship with candidates.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    text: {
      type: 'string',
      required: true,
    },

    // many to many relationship to all candidates
    raceCands: {
      collection: 'raceCandidate',
      via: 'raceCandUpdates',
    },

    presCands: {
      collection: 'presidentialCandidate',
      via: 'presCandUpdates',
    },

    incumbents: {
      collection: 'incumbent',
      via: 'incumbentUpdates',
    },

    candidateUpdates: {
      collection: 'candidate',
      via: 'candidateUpdates',
    },
  },
};
