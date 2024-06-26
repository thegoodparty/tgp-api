module.exports = {
  friendlyName: 'List of onboarding (Admin)',

  inputs: {
    state: {
      type: 'string',
    },
    slug: {
      type: 'string',
    },
    email: {
      // can be partial
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
      email,
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
        !email &&
        !level &&
        !primaryElectionDateStart &&
        !primaryElectionDateEnd &&
        !campaignStatus &&
        !generalElectionDateStart &&
        !generalElectionDateEnd
      ) {
        const campaigns = await Campaign.find({
          where: { user: { '!=': null } },
        })
          .populate('user')
          .populate('pathToVictory');

        return exits.success({
          campaigns,
        });
      } else {
        const query = `
        SELECT
          campaign.*,
          "user"."firstName" as "firstName", "user"."lastName" as "lastName", "user".phone as phone, "user".email as email,
          pathToVictory.data as "pathToVictory"
        FROM public.campaign
        JOIN public."user" ON "user".id = campaign.user
        JOIN public."pathtovictory" ON "pathtovictory".id = campaign."pathToVictory"
        WHERE campaign.user IS NOT NULL
        ${buildQueryWhereClause({
          state,
          slug,
          email,
          level,
          primaryElectionDateStart,
          primaryElectionDateEnd,
          campaignStatus,
          generalElectionDateStart,
          generalElectionDateEnd,
        })}
        ORDER BY campaign.id DESC;`;

        const campaigns = await sails.sendNativeQuery(query);

        // we need to match the format of the response from the ORM
        let cleanCampaigns = [];
        if (campaigns.rows) {
          cleanCampaigns = campaigns.rows.map((campaign) => {
            if (campaign.pathToVictory) {
              campaign.pathToVictory = { data: campaign.pathToVictory };
            }
            campaign.user = {
              firstName: campaign.firstName,
              lastName: campaign.lastName,
              phone: campaign.phone,
              email: campaign.email,
            };
            return campaign;
          });
        }

        return exits.success({
          campaigns: cleanCampaigns,
        });
      }
    } catch (e) {
      console.log('Error in onboarding list', e);
      return exits.forbidden();
    }
  },
};

function buildQueryWhereClause({
  state,
  slug,
  email,
  level,
  primaryElectionDateStart,
  primaryElectionDateEnd,
  campaignStatus,
  generalElectionDateStart,
  generalElectionDateEnd,
}) {
  return `
  ${slug ? ` AND campaign.slug = '${slug}'` : ''}
  ${email ? ` AND "user".email ILIKE '%${email}%'` : ''}
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
