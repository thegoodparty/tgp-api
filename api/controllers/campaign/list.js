module.exports = {
  friendlyName: 'List of onboarding (Admin)',

  inputs: {
    level: {
      type: 'string',
    },
    primaryElectionDateStart: {
      type: 'string',
    },
    primaryElectionDateEnd: {
      type: 'string',
    },
    campaignStatus: {
      type: 'string',
    },
    generalElectionDateStart: {
      type: 'string',
    },
    generalElectionDateEnd: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Onboardings Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const {
        level,
        primaryElectionDateStart,
        primaryElectionDateEnd,
        campaignStatus,
        generalElectionDateStart,
        generalElectionDateEnd,
      } = inputs;

      if (
        !level &&
        !primaryElectionDateStart &&
        !primaryElectionDateEnd &&
        !campaignStatus &&
        !generalElectionDateStart &&
        !generalElectionDateEnd
      ) {
        const campaigns = await Campaign.find({
          where: { user: { '!=': null } },
        }).populate('user');
        return exits.success({
          campaigns,
        });
      }

      const query = `
      SELECT campaign.*, "user".*
      FROM public.campaign
      JOIN public."user" ON "user".id = campaign.user
      WHERE campaign.user IS NOT NULL
      ${
        level
          ? `AND campaign.details->>'ballotLevel' = '${level.toUpperCase()}'`
          : ''
      }
      ORDER BY campaign.id DESC;
      `;
      console.log('query', query);
      const campaigns = await sails.sendNativeQuery(query);

      console.log('campaigns?.rows', campaigns?.rows);

      return exits.success({
        campaigns: campaigns?.rows || [],
      });
    } catch (e) {
      console.log('Error in onboarding list', e);
      return exits.forbidden();
    }
  },
};
