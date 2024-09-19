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

      let whereClauses = `WHERE c."user" IS NOT NULL AND c."isDemo" = false AND c."isActive" = true`;

      if (partyFilter) {
        whereClauses += ` AND c.details->>'party' = '${partyFilter}'`;
      }

      if (levelFilter) {
        whereClauses += ` AND c.details->>'ballotLevel' = '${levelFilter}'`;
      }

      if (resultsFilter) {
        whereClauses += ` AND c."didWin" = true`; // "didWin" is properly quoted
      }

      if (officeFilter) {
        whereClauses += ` AND (c.details->>'office' = '${officeFilter}' OR c.details->>'otherOffice' = '${officeFilter}')`;
      }

      if (isProd) {
        whereClauses += ` AND c.data->'hubSpotUpdates'->>'verified_candidates' = 'Yes'`;
      }

      // Native SQL query with proper column quoting and JOIN
      const rawQuery = `
        SELECT 
          c."slug", 
          c."details", 
          c."didWin", 
          u."firstName", 
          u."lastName", 
          u."avatar"
        FROM "campaign" c
        JOIN "user" u ON c."user" = u.id
        ${whereClauses};
      `;

      const result = await sails.sendNativeQuery(rawQuery);

      const campaigns = result.rows;

      const cleanCampaigns = [];
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        // temp - fix hubspot election results
        if (
          isProd &&
          campaign?.data?.hubSpotUpdates?.election_results === 'Won General' &&
          campaign.didWin !== true
        ) {
          await Campaign.updateOne({ slug: campaign.slug }).set({
            didWin: true,
          });
          campaign.didWin = true;
        }

        // temp fix done.

        if (!campaign.details?.zip || campaign.didWin === false) {
          continue;
        }

        let { details, slug, didWin, firstName, lastName, avatar } = campaign;
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

        if (nameFilter) {
          const fullName = `${firstName} ${lastName}`.toLowerCase();
          if (!fullName.includes(nameFilter.toLowerCase())) {
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
          firstName,
          lastName,
          avatar: avatar || false,
          electionDate,
        };

        if (!campaign.details?.geoLocation?.lng) {
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

          // temp - recalulate geolocation for campaigns who are not in the usa
          /*
const params = {
  IndexName: 'gp-api-location', // Specify your geocoding index name
  Text: zip,
  MaxResults: 1, // Limit to 1 result
  BiasPosition: [-98.35, 39.50], // Central point in the USA (Longitude, Latitude)
  FilterBBox: [-125.0, 24.396308, -66.93457, 49.384358], // Bounding box for the USA
};
          */
          if (
            cleanCampaign.position.lng < -125 ||
            cleanCampaign.position.lng > -66 ||
            cleanCampaign.position.lat < 24 ||
            cleanCampaign.position.lat > 49
          ) {
            const { lng, lat, geoHash } = await calculateGeoLocation(campaign);
            if (!lng) {
              continue;
            }
            cleanCampaign.position = { lng, lat };
          }
        }

        // Geolocation filtering
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
      { e },
    );
    return {};
  }
}
