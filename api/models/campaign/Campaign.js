module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    slug: {
      type: 'string',
      required: true,
      unique: true,
    },
    isActive: {
      type: 'boolean',
    },
    data: {
      type: 'json',
    },

    user: {
      model: 'user',
    },

    campaignsUpdateHistories: {
      collection: 'campaignUpdateHistory',
      via: 'campaign',
    },

    campaignPlanVersions: {
      collection: 'campaignPlanVersion',
      via: 'campaign',
    },

    // one to many relationship to candidateIssueItem
    candidatePositions: {
      collection: 'candidatePosition',
      via: 'campaign',
    },

    // one to many
    volunteerInvitations: {
      collection: 'volunteerInvitation',
      via: 'campaign',
    },

    // one to many
    campaignVolunteers: {
      collection: 'campaignVolunteer',
      via: 'campaign',
    },

    //many to many
    positions: {
      collection: 'position',
      via: 'campaigns',
    },
    //many to many
    topIssues: {
      collection: 'topIssue',
      via: 'campaigns',
    },
    // many to many
    voters: {
      collection: 'voter',
      via: 'campaigns',
    },
  },
};
