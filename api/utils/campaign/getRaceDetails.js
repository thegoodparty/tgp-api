async function getRaceDetails(raceId, slug, zip, getElectionDates = true) {
  let data = {};

  sails.helpers.log(slug, 'getting race from ballotReady api...');

  let race;
  try {
    race = await sails.helpers.ballotready.getRace(raceId);
  } catch (e) {
    sails.helpers.log(slug, 'error getting race details', e);
    return;
  }
  sails.helpers.log(slug, 'got ballotReady Race');

  let electionDate; // the date of the election
  let termLength = 4;
  let level = 'city';
  let positionId;
  let mtfcc;
  let geoId;
  let tier;

  try {
    electionDate = race?.election?.electionDay;
    termLength = race?.position?.electionFrequencies[0].frequency[0];
    level = race?.position?.level.toLowerCase();
    positionId = race?.position.id;
    mtfcc = race?.position.mtfcc;
    geoId = race?.position.geoId;
    tier = race?.position.tier;
  } catch (e) {
    sails.helpers.log(slug, 'error getting election date', e);
  }
  if (!electionDate) {
    return;
  }

  let electionLevel = 'city';
  try {
    electionLevel = await sails.helpers.ballotready.getRaceLevel(level);
  } catch (e) {
    sails.helpers.log(slug, 'error getting election level', e);
  }
  sails.helpers.log(slug, 'electionLevel', electionLevel);

  const officeName = race?.position?.name;
  if (!officeName) {
    sails.helpers.log(slug, 'error getting office name');
    return;
  }

  const partisanType = race?.position?.partisanType;
  const subAreaName =
    race?.position?.subAreaName && race.position.subAreaName !== 'null'
      ? race.position.subAreaName
      : undefined;
  const subAreaValue =
    race?.position?.subAreaValue && race.position.subAreaValue !== 'null'
      ? race.position.subAreaValue
      : undefined;
  const electionState = race?.election?.state;

  let locationResp;
  let county;
  let city;

  if (level !== 'state' && level !== 'federal') {
    // We use the mtfcc and geoId to get the city and county
    // and a more accurate electionLevel
    sails.helpers.log(slug, `mtfcc: ${mtfcc}, geoId: ${geoId}`);
    if (mtfcc && geoId) {
      let geoData = await sails.helpers.ballotready.resolveMtfcc(mtfcc, geoId);
      sails.helpers.log(slug, 'geoData', geoData);
      if (geoData?.city) {
        city = geoData.city;
        if (electionLevel !== 'city') {
          await sails.helpers.slack.slackHelper(
            {
              title: 'getRaceDetails Info.',
              body: `Info: ${slug}. MTFCC Found city ${geoData.city} but electionLevel is ${electionLevel}. Overriding electionLevel to city.`,
            },
            'victory-issues',
          );
          electionLevel = 'city';
        }
      }
      if (geoData?.county) {
        if (electionLevel !== 'county') {
          await sails.helpers.slack.slackHelper(
            {
              title: 'getRaceDetails Info.',
              body: `Info: ${slug}. MTFCC Found county ${geoData.county} but electionLevel is ${electionLevel}. Overriding electionLevel to county.`,
            },
            'victory-issues',
          );
          county = geoData.county;
          electionLevel = 'county';
        }
      }
      if (geoData?.state) {
        if (electionLevel !== 'state') {
          await sails.helpers.slack.slackHelper(
            {
              title: 'getRaceDetails Info.',
              body: `Info: ${slug}. MTFCC Found state ${geoData.state} but electionLevel is ${electionLevel}. Overriding electionLevel to state.`,
            },
            'victory-issues',
          );
          electionLevel = 'state';
        }
      }
      // TODO: electionLevel='local' could cause issues upstream
      // so we are leaving electionLevel as city for now.
      if (geoData?.township) {
        city = geoData.township;
        // electionLevel = 'local';
        electionLevel = 'city';
      }
      if (geoData?.town) {
        city = geoData.town;
        // electionLevel = 'local';
        electionLevel = 'city';
      }
      if (geoData?.village) {
        city = geoData.village;
        // electionLevel = 'local';
        electionLevel = 'city';
      }
      if (geoData?.borough) {
        city = geoData.borough;
        // electionLevel = 'local';
        electionLevel = 'city';
      }
    }

    if (city && city !== '') {
      city = city.replace(/ CCD$/, '');
      city = city.replace(/ City$/, '');
      // Note: we don't remove Town/Township/Village/Borough
      // because we want to keep that info for ai column matching.
    }
    if (county && county !== '') {
      county = county.replace(/ County$/, '');
    }

    if (
      (electionLevel === 'city' && !city) ||
      (electionLevel === 'county' && !county)
    ) {
      sails.helpers.log(
        slug,
        'could not find location from mtfcc. getting location from AI',
      );

      // If we couldn't get city/county with mtfcc/geo then use the AI.
      locationResp = await sails.helpers.ballotready.extractLocationAi(
        officeName + ' - ' + electionState,
        level,
      );
      sails.helpers.log(slug, 'locationResp', locationResp);
    }

    if (locationResp?.level) {
      if (locationResp.level === 'county') {
        county = locationResp.county;
      } else {
        if (
          locationResp.county &&
          locationResp.hasOwnProperty(locationResp.level)
        ) {
          city = locationResp[locationResp.level];
          county = locationResp.county;
        }
      }
    }
  }

  if (county) {
    sails.helpers.log(slug, 'Found county', county);
  }
  if (city) {
    sails.helpers.log(slug, 'Found city', city);
  }

  let priorElectionDates = [];
  // update: we will now attempt to get the election dates even if its a partisan election.
  if (getElectionDates) {
    if (positionId) {
      const ballotPosition = await BallotPosition.findOne({
        ballotHashId: positionId.toString(),
      });
      if (ballotPosition && ballotPosition?.ballotId) {
        const ballotPositionId = ballotPosition?.ballotId;
        priorElectionDates =
          await sails.helpers.ballotready.getElectionDatesPosition(
            slug,
            ballotPositionId,
          );
        sails.helpers.log(
          `priorElectionDates from PositionId ${ballotPositionId} `,
          priorElectionDates,
        );
      }
    }

    if ((!priorElectionDates || priorElectionDates.length === 0) && zip) {
      priorElectionDates = await sails.helpers.ballotready.getElectionDates(
        slug,
        officeName,
        zip,
        race?.position?.level,
      );
      sails.helpers.log(
        `priorElectionDates from zip ${zip}`,
        priorElectionDates,
      );
    }
  }

  data.slug = slug;
  data.officeName = officeName;
  data.electionDate = electionDate;
  data.electionTerm = termLength;
  data.electionLevel = electionLevel;
  data.electionState = electionState;
  data.electionCounty = county;
  data.electionMunicipality = city;
  data.subAreaName = subAreaName;
  data.subAreaValue = subAreaValue;
  data.partisanType = partisanType;
  data.priorElectionDates = priorElectionDates;
  data.positionId = positionId;
  data.tier = tier;
  return data;
}

module.exports = getRaceDetails;
