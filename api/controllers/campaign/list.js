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
        const res = this.res;
        let hasStarted = false;

        try {
          // Set headers for JSON response before any data is sent
          res.setHeader('Content-Type', 'application/json');

          const limit = 100; // Adjust limit based on your requirements
          let skip = 0;
          let hasMoreData = true;

          const passThrough = new PassThrough();

          passThrough.on('error', (err) => {
            console.error('Error in PassThrough stream:', err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Internal Server Error' });
            } else {
              res.end();
            }
          });

          passThrough.on('end', () => {
            if (!hasStarted) {
              res.write('[]');
            }
            return exits.success();
          });

          // Pipe the PassThrough stream to the response
          passThrough.pipe(res);

          // Start the JSON array before any data is sent
          res.write('[');

          // Function to fetch and stream data in chunks
          async function fetchAndStreamData() {
            try {
              while (hasMoreData) {
                const campaigns = await Campaign.find({
                  where: { user: { '!=': null } },
                  limit: limit,
                  skip: skip,
                })
                  .populate('user')
                  .populate('pathToVictory');

                if (campaigns.length > 0) {
                  // Stream each campaign as a JSON string
                  campaigns.forEach((campaign, index) => {
                    if (skip > 0 || index > 0 || hasStarted) {
                      res.write(','); // Add a comma if not the first item
                    }
                    res.write(JSON.stringify(campaign));
                    hasStarted = true;
                  });

                  skip += limit;
                } else {
                  hasMoreData = false;
                }
              }

              // End the JSON array
              res.write(']');
              res.end();
            } catch (err) {
              console.error('Error in fetchAndStreamData:', err);
              if (!res.headersSent) {
                res.status(500).json({ error: 'Internal Server Error' });
              } else {
                res.end();
              }
            }
          }

          // Start fetching and streaming data
          fetchAndStreamData();
        } catch (err) {
          console.error('Error in action:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.end();
          }
        }
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
