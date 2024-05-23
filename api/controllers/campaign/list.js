module.exports = {
  friendlyName: 'List of onboarding (Admin)',

  inputs: {
    state: {
      type: 'string',
    },
    slug: {
      type: 'string',
    },
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
    const {
      state,
      slug,
      level,
      primaryElectionDateStart,
      primaryElectionDateEnd,
      campaignStatus,
      generalElectionDateStart,
      generalElectionDateEnd,
    } = inputs;
    try {
      if (
        !state &&
        !slug &&
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
        ${buildQueryWhereClause({
          state,
          slug,
          level,
          primaryElectionDateStart,
          primaryElectionDateEnd,
          campaignStatus,
          generalElectionDateStart,
          generalElectionDateEnd,
        })}
        ORDER BY campaign.id DESC;`;

      const campaigns = await sails.sendNativeQuery(query);

      return exits.success({
        campaigns: campaigns?.rows || [],
      });
    } catch (e) {
      console.log('Error in onboarding list', e);
      return exits.forbidden();
    }
  },
};

function buildQueryWhereClause({
  state,
  slug,
  level,
  primaryElectionDateStart,
  primaryElectionDateEnd,
  campaignStatus,
  generalElectionDateStart,
  generalElectionDateEnd,
}) {
  return `
  ${slug ? ` AND campaign.slug = '${slug}'` : ''}
  ${state ? ` AND campaign.details->>'state' = '${state}'` : ''}
  ${
    level
      ? ` AND campaign.details->>'ballotLevel' = '${level.toUpperCase()}'`
      : ''
  }
  ${
    campaignStatus
      ? ` AND campaign."isActive" = ${
          campaignStatus === 'active' ? 'true' : 'false'
        }`
      : ''
  }
  ${
    primaryElectionDateStart
      ? ` AND campaign.details->>'primaryElectionDate' >= '${primaryElectionDateStart}'`
      : ''
  }
  ${
    primaryElectionDateEnd
      ? ` AND campaign.details->>'primaryElectionDate' <= '${primaryElectionDateEnd}'`
      : ''
  }
  ${
    generalElectionDateStart
      ? ` AND campaign.details->>'electionDate' >= '${generalElectionDateStart}'`
      : ''
  }
  ${
    generalElectionDateEnd
      ? ` AND campaign.details->>'electionDate' <= '${generalElectionDateEnd}'`
      : ''
  }
`;
}
