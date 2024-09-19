const appBase = sails.config.custom.appBase || sails.config.appBase;
module.exports = {
  friendlyName: 'List of onboarding (Admin)',

  inputs: {},

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
      const campaigns = await Campaign.find({
        select: ['details', 'didWin', 'data', 'user'],
        where: { user: { '!=': null }, isDemo: false, isActive: true },
      });

      let count = 0;
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        if (
          !campaign.user ||
          !campaign.details?.zip ||
          campaign.didWin === false ||
          !campaign.details?.geoLocation?.lng
        ) {
          continue;
        }
        if (isProd) {
          if (campaign.data?.hubSpotUpdates?.verified_candidates !== 'Yes') {
            continue;
          }
        }
        if (
          campaign.details?.geoLocation?.lng < -125 ||
          campaign.details?.geoLocation?.lng > -66 ||
          campaign.details?.geoLocation?.lat < 24 ||
          campaign.details?.geoLocation?.lat > 49
        ) {
          continue;
        }

        count++;
      }

      return exits.success({
        count,
      });
    } catch (e) {
      console.log('Error in campaign list map', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error in campaign list map',
        { e },
      );
      return exits.forbidden();
    }
  },
};

async function calculateGeoLocation(campaign) {
  try {
    console.log('calculating');
    if (!campaign.details?.zip) {
      return {};
    }
    const { lng, lat, geoHash } = await sails.helpers.geocoding.zipToLatLng(
      campaign.details?.zip,
    );
    await Campaign.updateOne({ slug: campaign.slug }).set({
      details: {
        ...campaign.details,
        geoLocation: {
          geoHash,
          lat,
          lng,
        },
      },
    });
    return { lng, lat, geoHash };
  } catch (e) {
    console.log('error at calculateGeoLocation', e);
    await sails.helpers.slack.errorLoggerHelper(
      'error at calculateGeoLocation',
      {
        e,
      },
    );
    return {};
  }
}
