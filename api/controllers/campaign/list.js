const { Client } = require('pg');
const { PassThrough } = require('stream');

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
        // const query = await Campaign.find({
        //   where: { user: { '!=': null } },
        // })
        //   .populate('user')
        //   .populate('pathToVictory');

        const client = new Client({
          connectionString: sails.config.datastores.default.url,
        });

        await client.connect();

        const query = `
          SELECT 
        c.*, u.*, p.*
      FROM 
        public.campaign c
      LEFT JOIN 
        public.user u ON c.user = u.id
      LEFT JOIN 
        public.pathtovictory p ON c."pathToVictory" = p.id
      WHERE 
        c.user IS NOT NULL
        `;

        const passThroughStream = new PassThrough();
        let isFirstChunk = true;

        this.res.set('Content-Type', 'application/json');
        this.res.write('[');

        const queryStream = client.query(new Client.Query(query));

        queryStream.on('row', (row) => {
          if (!isFirstChunk) {
            passThroughStream.write(',');
          }
          passThroughStream.write(JSON.stringify(row));
          isFirstChunk = false;
        });

        queryStream.on('end', async () => {
          passThroughStream.write(']');
          passThroughStream.end();
          await client.end();
        });

        queryStream.on('error', async (err) => {
          passThroughStream.emit('error', err);
          await client.end();
        });

        passThroughStream.on('error', (err) => {
          return exits.error(err);
        });

        passThroughStream.pipe(this.res).on('finish', () => {
          // Ensure that the response is properly ended
          this.res.end();
          // return exits.success();
        });
      } else {
        const query = `
        SELECT
          campaign.*,
          "user"."firstName" as "firstName", "user"."lastName" as "lastName", "user".phone as phone, "user".email as email,
          pathToVictory.data as "pathToVictory"
        FROM public.campaign
        JOIN public."user" ON "user".id = campaign.user
        LEFT JOIN public."pathtovictory" ON "pathtovictory".id = campaign."pathToVictory"
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
