module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    data: {
      type: 'json',
    },

    // has one

    voter: {
      model: 'Voter',
    },

    campaign: {
      model: 'campaign',
    },

    dkCampaign: {
      model: 'DoorKnockingCampaign',
    },

    route: {
      model: 'DoorKnockingRoute',
    },

    volunteer: {
      model: 'campaignVolunteer',
    },
  },
};
