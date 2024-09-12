module.exports = {
  friendlyName: 'CreateCampaignTeamRequest',

  description: 'Create request to join a campaign team',

  inputs: {
    email: {
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
      responseType: 'ok',
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
      ? await sails.helpers.campaign.byUser(candidateUser)
      : null;
    await Requests.create({
      user,
      email: candidateEmail,
      role,
      ...(campaign ? { campaign: campaign.id } : {}),
    }).fetch();

    // All done.
    return exits.success({
      message: 'Campaign Request was created.',
    });
  },
};
