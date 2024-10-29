const appBase = sails.config.custom.appBase || sails.config.appBase;
const moment = require('moment');
module.exports = {
  friendlyName: 'List of onboarding (Admin)',

  inputs: {
    state: {
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
      const isProd = appBase === 'https://goodparty.org';

      const { state } = inputs;

      const campaigns = await Campaign.find({
        select: ['details', 'didWin', 'data', 'user'],
        where: { user: { '!=': null }, isDemo: false, isActive: true },
      });

      const lastWeek = moment().subtract(7, 'days');

      let count = 0;
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];

        const { details, didWin, data, user } = campaign;

        if (
          !user ||
          !details?.zip ||
          didWin === false ||
          !details?.geoLocation?.lng ||
          details?.geoLocationFailed
        ) {
          continue;
        }
        if (state && details?.state !== state) {
          continue;
        }
        if (isProd) {
          if (data?.hubSpotUpdates?.verified_candidates !== 'Yes') {
            continue;
          }
        }

        if (didWin === null) {
          const date = moment(details.electionDate);
          if (date.isBefore(lastWeek)) {
            continue;
          }
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
