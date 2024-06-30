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
      allowNull: true,
    },
    data: {
      type: 'json',
    },
    dataCopy: {
      type: 'json',
    },
    details: {
      type: 'json',
      columnType: 'jsonb',
    },
    aiContent: {
      type: 'json',
      columnType: 'jsonb',
    },

    isVerified: {
      type: 'boolean',
      allowNull: true,
    },
    dateVerified: {
      type: 'string',
      columnType: 'date',
      allowNull: true,
    },
    tier: {
      type: 'string',
      allowNull: true,
      isIn: ['WIN', 'LOSE', 'TOSSUP'],
    },
    isPro: {
      type: 'boolean',
      defaultsTo: false,
      allowNull: true,
    },
    didWin: {
      type: 'boolean',
      allowNull: true,
    },
    user: {
      model: 'user',
      autoMigrations: { index: true },
    },

    pathToVictory: {
      model: 'pathToVictory',
    },

    campaignsUpdateHistories: {
      collection: 'campaignUpdateHistory',
      via: 'campaign',
    },

    campaignPlanVersions: {
      collection: 'campaignPlanVersion',
      via: 'campaign',
    },

    // one to one relationship
    ballotCandidate: {
      model: 'BallotCandidate',
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

    // one to many
    doorKnockingCampaigns: {
      collection: 'doorKnockingCampaign',
      via: 'campaign',
    },

    // one to many
    surveys: {
      collection: 'survey',
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
