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
    forceReCalc: {
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
      const {
        party: partyFilter,
        state: stateFilter,
        level: levelFilter,
        results: resultsFilter,
        office: officeFilter,
        name: nameFilter,
        forceReCalc,
      } = inputs;

      const isProd = appBase === 'https://goodparty.org';

      let whereClauses = `WHERE c."user" IS NOT NULL AND c."isDemo" = false`;
      // election date this year (2024)
      whereClauses += ` AND c.details->>'electionDate' LIKE '2024%'`;

      if (partyFilter) {
        whereClauses += ` AND LOWER(c.details->>'party') LIKE '${partyFilter}%'`;
      }

      if (stateFilter) {
        whereClauses += ` AND c.details->>'state' = '${stateFilter}'`;
      }

      if (levelFilter) {
        whereClauses += ` AND c.details->>'ballotLevel' = '${levelFilter}'`;
      }

      if (officeFilter) {
        whereClauses += ` AND (c.details->>'normalizedOffice' = '${officeFilter}' OR c.details->>'office' = '${officeFilter}' OR c.details->>'otherOffice' = '${officeFilter}')`;
      }

      if (resultsFilter) {
        // "didWin" is properly quoted
        whereClauses += ` AND (c."didWin" = true 
          OR LOWER(c.data->'hubSpotUpdates'->>'election_results') = 'won general')`;
        // OR LOWER(c.data->'hubSpotUpdates'->>'primary_election_result') = 'won primary')`;
      } else if (isProd) {
        whereClauses += ` AND c.data->'hubSpotUpdates'->>'verified_candidates' = 'Yes'`;
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

      const cleanCampaigns = [];
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];

        let { details, slug, didWin, firstName, lastName, avatar, data } =
          campaign;
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
          county,
          city,
        } = details || {};

        const resolvedOffice = otherOffice || office;

        if (nameFilter) {
          const fullName = `${firstName} ${lastName}`.toLowerCase();
          if (!fullName.includes(nameFilter.toLowerCase())) {
            continue;
          }
        }
        const hubSpotOffice = data?.hubSpotUpdates?.office_type;
        let normalizedOffice = hubSpotOffice || details?.normalizedOffice;

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
          data,
          office: resolvedOffice,
          state,
          ballotLevel,
          zip,
          party,
          firstName,
          lastName,
          avatar: avatar || false,
          electionDate,
          county,
          city,
          normalizedOffice: normalizedOffice || resolvedOffice,
        };

        const position = await handleGeoLocation(campaign, forceReCalc);
        if (!position) {
          continue;
        } else {
          cleanCampaign.position = position;
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

async function handleGeoLocation(campaign, forceReCalc) {
  let { details } = campaign;
  const { geoLocationFailed, geoLocation } = details || {};

  if (!forceReCalc && geoLocationFailed) {
    return false;
  }

  if (forceReCalc || !geoLocation?.lng) {
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
    if (!campaign.details?.zip || !campaign.details?.state) {
      return {};
    }
    const { lng, lat, geoHash } = await sails.helpers.geocoding.zipToLatLng(
      campaign.details?.zip,
      campaign.details?.state,
    );
    await Campaign.updateOne({ slug: campaign.slug }).set({
      details: {
        ...campaign.details,
        geoLocationFailed: false,
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
