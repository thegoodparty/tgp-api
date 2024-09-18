const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  friendlyName: 'List of onboarding (Admin)',

  inputs: {
    party: {
      type: 'string',
    },
    level: {
      type: 'string',
    },
    results: {
      type: 'boolean',
    },
    office: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    neLat: {
      type: 'number',
    },
    neLng: {
      type: 'number',
    },
    swLat: {
      type: 'number',
    },
    swLng: {
      type: 'number',
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
        party: partyFilter,
        level: levelFilter,
        results: resultsFilter,
        office: officeFilter,
        name: nameFilter,
        neLat,
        neLng,
        swLat,
        swLng,
      } = inputs;

      const isProd = appBase === 'https://goodparty.org';
      const campaigns = await Campaign.find({
        select: ['slug', 'details', 'data', 'didWin'],
        where: {
          user: { '!=': null },
          isDemo: false,
          isActive: true,
        },
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

        if (partyFilter && partyFilter !== party) {
          continue;
        }
        if (levelFilter && levelFilter !== ballotLevel) {
          continue;
        }
        if (resultsFilter && didWin !== true) {
          continue;
        }
        const resolvedOffice = otherOffice || office;
        if (officeFilter && officeFilter !== resolvedOffice) {
          continue;
        }
        if (nameFilter) {
          const name = `${user.firstName} ${user.lastName}`.toLowerCase();
          if (!name.includes(nameFilter.toLowerCase())) {
            continue;
          }
        }
        const cleanCampaign = {
          slug,
          id: slug,
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
          cleanCampaign.position = { lng, lat };
        } else {
          cleanCampaign.position = {
            lng: campaign.details.geoLocation.lng,
            lat: campaign.details.geoLocation.lat,
          };
        }
        if (
          neLat &&
          neLng &&
          swLat &&
          swLng &&
          cleanCampaign.position.lat &&
          cleanCampaign.position.lng
        ) {
          if (
            cleanCampaign.position.lat < swLat ||
            cleanCampaign.position.lat > neLat ||
            cleanCampaign.position.lng < swLng ||
            cleanCampaign.position.lng > neLng
          ) {
            continue;
          }
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
