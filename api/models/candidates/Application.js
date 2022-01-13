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

    status: {
      type: 'string',
      isIn: ['incomplete', 'in review', 'approved', 'rejected'],
      defaultsTo: 'incomplete',
    },
    data: {
      type: 'string',
    },

    user: {
      model: 'user',
    },
  },
};
