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
      isIn: ['not-claimed', 'claimed', 'in progress', 'completed'],
      defaultsTo: 'not-claimed',
    },

    // has one

    dkCampaign: {
      model: 'DoorKnockingCampaign',
    },

    volunteer: {
      model: 'campaignVolunteer',
    },
  },
};
