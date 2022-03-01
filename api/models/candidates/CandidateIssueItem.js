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

    positionId: {
      type: 'string',
    },
    websiteUrl: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    status: {
      type: 'string',
      isIn: ['pending', 'accepted', 'rejected'],
      defaultsTo: 'pending',
    },

    // one-to-one
    candidate: {
      model: 'candidate',
    },
    // one-to-one
    topic: {
      model: 'issuetopic',
    },
  },
};
