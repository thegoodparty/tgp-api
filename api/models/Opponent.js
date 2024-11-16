module.exports = { 
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    
    partyAffiliation: {
      type: 'string',
      allowNull: true,
    },
    firstName: {
      type: 'string',
      required: true,
    },
    lastName: {
      type: 'string',
      required: true,
    },
    sourceUrl: {
      type: 'string',
      allowNull: true,
    },
    campaignUrl: {
      type: 'string',
      allowNull: true,
    },
    financeFilingUrl: {
      type: 'string',
      allowNull: true,
    },
    // Many to one relationship
    campaignId: {
      model: 'campaign',
      required: true,
    },
  },
};