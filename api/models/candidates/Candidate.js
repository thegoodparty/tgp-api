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

    firstName: {
      type: 'string',
      required: true,
      description: "Candidate's first name.",
      maxLength: 60,
    },
    lastName: {
      type: 'string',
      required: true,
      description: "Candidate's last name.",
      maxLength: 60,
    },
    isActive: {
      type: 'boolean',
    },
    chamber: {
      type: 'string',
    },
    isOnHomepage: {
      type: 'boolean',
      defaultsTo: false,
    },
    state: {
      type: 'string',
    },
    data: {
      type: 'string',
      description: 'JSON.stringified string of all the other properties',
    },

    // one-to-one
    user: {
      collection: 'user',
      via: 'candidate',
    },

    // one to many relationship to campaignUpdates
    candidateUpdates: {
      collection: 'campaignupdate',
      via: 'candidate',
    },
  },

  customToJSON: function() {
    // Return a shallow copy of this record with the password removed.
    return _.omit(this, ['createdAt', 'updatedAt']);
  },
};
