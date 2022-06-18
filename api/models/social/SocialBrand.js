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

    name: {
      type: 'string',
      required: true,
    },
    brandId: {
      type: 'number',
      required: true,
      unique: true,
      description: 'brand id on pulsar',
    },
    profiles: {
      type: 'json',
      required: true,
      description: 'array of profiles',
    },
    // on to one
    candidate: {
      model: 'candidate',
      unique: true,
    },

    // on to many
    socialStats: {
      collection: 'socialStat',
      via: 'socialBrand',
    },
  },
};
