/**
 * Ranking.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    channel: {
      type: 'string',
      required: true,
    },
    name: {
      type: 'string',
    },
    date: {
      type: 'string',
      required: true,
    },
    profileId: {
      type: 'number',
      required: true,
      description: 'profile (channel) id on pulsar',
    },
    action: {
      type: 'string',
      required: true,
      description: 'followers, mentions',
    },
    count: {
      type: 'number',
      required: true,
    },

    // on to many
    candidate: {
      model: 'candidate',
    },

    socialBrand: {
      model: 'socialBrand',
    },
  },
};
