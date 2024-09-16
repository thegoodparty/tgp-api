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
      await sails.helpers.slack.errorLoggerHelper('campaign list map', {
        isProd,
      });
      const campaigns = await Campaign.find({
        select: ['slug', 'details', 'data', 'didWin'],
        where: { user: { '!=': null }, isDemo: false, isActive: true },
      }).populate('user');

      const cleanCampaigns = [];
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        if (
          !campaign.user ||
          !campaign.details?.zip ||
          campaign.didWin === false
        ) {
          continue;
        }
        let { details, slug, didWin, user, data } = campaign;
        // on prod we filter only verified candidates from hubspot.
        if (isProd) {
          if (data?.hubSpotUpdates?.verified_candidates !== 'Yes') {
            continue;
          }
        }
        const {
          otherOffice,
          office,
          state,
          ballotLevel,
          zip,
          party,
          electionDate,
        } = details || {};
        const resolvedOffice = otherOffice || office;
        const cleanCampaign = {
          slug,
          didWin,
          office: resolvedOffice,
          state,
          ballotLevel,
          zip,
          party,
          firstName: user?.firstName,
          lastName: user?.lastName,
          avatar: user?.avatar || false,
          electionDate,
        };

        if (!campaign.details.geoLocation) {
          const { lng, lat, geoHash } = await calculateGeoLocation(campaign);
          if (!lng) {
            continue;
          }
          cleanCampaign.geoLocation = { lng, lat, geoHash };
        } else {
          cleanCampaign.geoLocation = campaign.details.geoLocation;
        }
        cleanCampaigns.push(cleanCampaign);
      }

      return exits.success({
        campaigns: cleanCampaigns,
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
