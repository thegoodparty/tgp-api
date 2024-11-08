const appBase = sails.config.custom.appBase || sails.config.appBase;
const moment = require('moment');
module.exports = {
  friendlyName: 'List of onboarding (Admin)',

  inputs: {
    state: {
      type: 'string',
    },
    results: {
      type: 'boolean',
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
      const isProd = appBase === 'https://goodparty.org';

      const { state, results } = inputs;

      let whereClauses = `WHERE c."user" IS NOT NULL AND c."isDemo" = false`;

      if (state) {
        whereClauses += ` AND c.details->>'state' = '${state}'`;
      }

      if (results) {
        whereClauses += ` AND (c."didWin" = true OR c.data->'hubSpotUpdates'->>'election_results' = 'Won General' OR c.data->'hubSpotUpdates'->>'primary_election_result' = 'Won Primary')`; // "didWin" is properly quoted
      }

      // Native SQL query with proper column quoting and JOIN
      const rawQuery = `
       SELECT 
         c."slug", 
         c."details", 
         c."didWin", 
         c."data", 
         u."firstName", 
         u."lastName", 
         u."avatar"
       FROM "campaign" c
       JOIN "user" u ON c."user" = u.id
       ${whereClauses};
     `;

      const result = await sails.sendNativeQuery(rawQuery);

      const campaigns = result.rows;

      const yearStart = moment('1/1/2024');
      const yearEnd = moment('1/1/2025');

      let count = 0;
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];

        const { details, didWin, data } = campaign;

        if (
          !details?.zip ||
          didWin === false ||
          !details?.geoLocation?.lng ||
          details?.geoLocationFailed
        ) {
          continue;
        }

        if (isProd) {
          if (data?.hubSpotUpdates?.verified_candidates !== 'Yes') {
            continue;
          }
        }

        if (date.isBefore(yearStart) || date.isAfter(yearEnd)) {
          continue;
        }

        count++;
      }

      return exits.success({
        count,
      });
    } catch (e) {
      console.log('Error in campaign list map.', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error in campaign list map',
        { e },
      );
      return exits.forbidden();
    }
  },
};
