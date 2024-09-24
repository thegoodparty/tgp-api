const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  friendlyName: 'List of onboarding (Admin)',

  inputs: {
    party: {
      type: 'string',
    },
    state: {
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
        state: stateFilter,
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

      if (stateFilter) {
        whereClauses += ` AND c.details->>'state' = '${stateFilter}'`;
      }

      if (levelFilter) {
        whereClauses += ` AND c.details->>'ballotLevel' = '${levelFilter}'`;
      }

      if (resultsFilter) {
        whereClauses += ` AND c."didWin" = true`; // "didWin" is properly quoted
      }

      if (officeFilter) {
        whereClauses += ` AND (c.details->>'normalizedOffice' = '${officeFilter}' OR c.details->>'office' = '${officeFilter}' OR c.details->>'otherOffice' = '${officeFilter}')`;
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
          raceId,
          noNormalizedOffice,
        } = details || {};

        const resolvedOffice = otherOffice || office;

        if (nameFilter) {
          const fullName = `${firstName} ${lastName}`.toLowerCase();
          if (!fullName.includes(nameFilter.toLowerCase())) {
            continue;
          }
        }
        let normalizedOffice = details?.normalizedOffice;

        if (!normalizedOffice && raceId && !noNormalizedOffice) {
          const race = await BallotRace.findOne({ ballotHashId: raceId });
          normalizedOffice = race?.data?.normalized_position_name;
          if (normalizedOffice) {
            await Campaign.updateOne({ slug }).set({
              details: { ...details, normalizedOffice },
            });
          } else {
            await Campaign.updateOne({ slug }).set({
              details: { ...details, noNormalizedOffice: true },
            });
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
          normalizedOffice: normalizedOffice || resolvedOffice,
        };

        const position = await handleGeoLocation(campaign);
        if (!position) {
          continue;
        } else {
          cleanCampaign.position = position;
        }

        let isInBound = filterPosition(
          cleanCampaign,
          neLat,
          neLng,
          swLat,
          swLng,
        );
        if (!isInBound) {
          continue;
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

async function handleGeoLocation(campaign) {
  let { details } = campaign;
  const { geoLocationFailed, geoLocation } = details || {};

  // TODO: remove! TEMPORARY DISABLE WEB-2949
  // if (geoLocationFailed) {
  //   return false;
  // }

  if (!geoLocation?.lng) {
    const { lng, lat, geoHash } = await calculateGeoLocation(campaign);
    if (!lng) {
      await Campaign.updateOne({
        slug: campaign.slug,
      }).set({
        details: {
          ...campaign.details,
          geoLocationFailed: true,
        },
      });
      return false;
    }
    return { lng, lat };
  } else {
    return {
      lng: campaign.details.geoLocation.lng,
      lat: campaign.details.geoLocation.lat,
    };
  }
}

function filterPosition(campaign, neLat, neLng, swLat, swLng) {
  // Geolocation filtering
  if (
    neLat &&
    neLng &&
    swLat &&
    swLng &&
    campaign.position.lat &&
    campaign.position.lng
  ) {
    if (
      campaign.position.lat < swLat ||
      campaign.position.lat > neLat ||
      campaign.position.lng < swLng ||
      campaign.position.lng > neLng
    ) {
      return false;
    }
    return true;
  } else {
    return true;
  }
}

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
