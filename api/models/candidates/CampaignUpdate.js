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
    },
    date: {
      type: 'string',
    },
    youtubeId: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    image: {
      type: 'string',
    },
    start: {
      type: 'number',
    },

    candidate: {
      model: 'candidate',
    },
  },
};
