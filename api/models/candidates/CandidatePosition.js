/**
 * Candidate.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

// this is the new Candidate Model. We will move all the other candidates here.

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    description: {
      type: 'string',
    },
    order: {
      type: 'number',
    },

    // has One
    candidate: {
      model: 'candidate',
    },

    // has One
    campaign: {
      model: 'campaign',
    },

    // has One
    topIssue: {
      model: 'topIssue',
    },

    // has One
    position: {
      model: 'position',
    },
  },
};
