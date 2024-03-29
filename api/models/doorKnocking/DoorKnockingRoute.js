module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    data: {
      type: 'json',
    },
    status: {
      type: 'string',
      isIn: [
        'not-claimed',
        'claimed',
        'in-progress',
        'completed',
        'not-calculated',
      ],
      defaultsTo: 'not-claimed',
    },

    // has one

    dkCampaign: {
      model: 'DoorKnockingCampaign',
    },

    volunteer: {
      model: 'campaignVolunteer',
    },

    // one to many
    surveys: {
      collection: 'survey',
      via: 'route',
    },
  },
};
