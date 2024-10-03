const attachTeamMembers = (campaigns, campaignVolunteersMapping) => {
  const teamMembersMap = campaignVolunteersMapping.reduce(
    (members, { user, campaign, role }) => {
      const teamMember = {
        ...user,
        role,
      };

      return {
        ...members,
        [campaign]: members[campaign]
          ? [...members[campaign], teamMember]
          : [teamMember],
      };
    },
    {},
  );

  return campaigns.map((campaign) => ({
    ...campaign,
    teamMembers: teamMembersMap[campaign.id] || [],
  }));
};

const buildQueryWhereClause = ({
  id,
  state,
  slug,
  email,
  level,
  primaryElectionDateStart,
  primaryElectionDateEnd,
  campaignStatus,
  generalElectionDateStart,
  generalElectionDateEnd,
}) => `
  ${id ? ` AND c.id = ${id}` : ''}
  ${slug ? ` AND c.slug ILIKE '%${slug}%'` : ''}
  ${email ? ` AND u.email ILIKE '%${email}%'` : ''}
  ${state ? ` AND c.details->>'state' = '${state}'` : ''}
  ${level ? ` AND c.details->>'ballotLevel' = '${level.toUpperCase()}'` : ''}
  ${
    campaignStatus
      ? ` AND c."isActive" = ${campaignStatus === 'active' ? 'true' : 'false'}`
      : ''
  }
  ${
    primaryElectionDateStart
      ? ` AND c.details->>'primaryElectionDate' >= '${primaryElectionDateStart}'`
      : ''
  }
  ${
    primaryElectionDateEnd
      ? ` AND c.details->>'primaryElectionDate' <= '${primaryElectionDateEnd}'`
      : ''
  }
  ${
    generalElectionDateStart
      ? ` AND c.details->>'electionDate' >= '${generalElectionDateStart}'`
      : ''
  }
  ${
    generalElectionDateEnd
      ? ` AND c.details->>'electionDate' <= '${generalElectionDateEnd}'`
      : ''
  }
`;

const buildCustomCampaignListQuery = ({
  id,
  state,
  slug,
  email,
  level,
  primaryElectionDateStart,
  primaryElectionDateEnd,
  campaignStatus,
  generalElectionDateStart,
  generalElectionDateEnd,
}) => `
  SELECT
    c.*,
    u."firstName" as "firstName",
    u."lastName" as "lastName",
    u.phone as "phone",
    u.email as "email",
    u."metaData",
    p.data as "pathToVictory"
  FROM public.campaign AS c
  JOIN public."user" AS u ON u.id = c.user
  LEFT JOIN public."pathtovictory" as p ON p.id = c."pathToVictory"
  WHERE c.user IS NOT NULL
  ${buildQueryWhereClause({
    id,
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
  ORDER BY c.id DESC;
`;

module.exports = {
  friendlyName: 'List of onboarding (Admin)',

  inputs: {
    id: { type: 'number' },
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
      id,
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
      let campaigns = [];
      if (
        !id &&
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
        campaigns = await Campaign.find({
          where: { user: { '!=': null } },
        })
          .populate('user')
          .populate('pathToVictory');
      } else {
        campaigns = await sails.sendNativeQuery(
          buildCustomCampaignListQuery(inputs),
        );
        // we need to match the format of the response from the ORM
        let cleanCampaigns = [];
        if (campaigns.rows) {
          cleanCampaigns = campaigns.rows.map((campaign) => {
            if (campaign.pathToVictory) {
              campaign.pathToVictory = { data: campaign.pathToVictory };
            }
            const userMeta = JSON.parse(campaign.metaData || '{}');
            campaign.user = {
              firstName: campaign.firstName,
              lastName: campaign.lastName,
              phone: campaign.phone,
              email: campaign.email,
              // We need to parseInt because for some God awful reason the ORM returns it as a string
              lastVisited: parseInt(userMeta.lastVisited),
            };
            return {
              ...campaign,
              // We need to parseInt because for some God awful reason the ORM returns it as a string
              createdAt: parseInt(campaign.createdAt),
              updatedAt: parseInt(campaign.updatedAt),
            };
          });
        }

        campaigns = cleanCampaigns;
      }

      const campaignVolunteersMapping = await CampaignVolunteer.find({
        campaign: campaigns.map((campaign) => campaign.id),
      }).populate('user');

      return exits.success({
        campaigns: attachTeamMembers(campaigns, campaignVolunteersMapping),
      });
    } catch (e) {
      console.log('Error in onboarding list', e);
      return exits.forbidden();
    }
  },
};
