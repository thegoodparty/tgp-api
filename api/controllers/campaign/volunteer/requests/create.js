module.exports = {
  friendlyName: 'CreateCampaignTeamRequest',

  description: 'Create request to join a campaign team',

  inputs: {
    candidateEmail: {
      type: 'string',
      required: true,
      isEmail: true,
    },

    role: {
      type: 'string',
      isIn: ['volunteer', 'manager', 'staff'],
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Campaign Request was created.',
    },
    error: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { user } = this.req;
    const { candidateEmail, role } = inputs;

    const candidateUser = await sails.helpers.user.byEmail(candidateEmail);
    const campaign = candidateUser
      ? await sails.helpers.campaign.byUser(candidateUser?.id)
      : null;
    try {
      const existingRequest = await Requests.findOne({
        user: user.id,
        candidateEmail,
        role,
      });

      if (existingRequest) {
        throw new Error('Request to join campaign already exists');
      }

      const campaignRequest = await Requests.create({
        user: user.id,
        candidateEmail,
        role,
        campaign: campaign?.id || null,
      }).fetch();

      // All done.
      return exits.success(campaignRequest);
    } catch (e) {
      console.error('error creating campaign request', e);
      return exits.error(e);
    }
  },
};
