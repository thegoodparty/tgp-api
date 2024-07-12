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
  sails.helpers.log(slug, 'ballotReady Race', race);

  let electionDate; // the date of the election
  let termLength = 4;
  let level = 'city';
  let positionId;
  let mtfcc;
  let geoId;

  try {
    electionDate = race?.election?.electionDay;
    termLength = race?.position?.electionFrequencies[0].frequency[0];
    level = race?.position?.level.toLowerCase();
    positionId = race?.position.id;
    mtfcc = race?.position.mtfcc;
    geoId = race?.position.geoId;
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
    locationResp = await sails.helpers.ballotready.extractLocationAi(
      officeName + ' - ' + electionState,
      level,
    );

    // Experimental -- but might be useful.
    // This doesn't really give a city name perse
    // But we can use it maybe combined with the AI.
    // if (mtfcc && geoId && electionLevel === 'city') {
    //   let geoData = await sails.helpers.ballotready.resolveMtfcc(mtfcc, geoId);
    //   if (geoData?.city) {
    //     city = geoData.city;
    //   }
    // }

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

  sails.helpers.log(slug, 'locationResp', locationResp);
  sails.helpers.log(slug, 'county', county);
  sails.helpers.log(slug, 'city', city);

  let priorElectionDates = [];
  if (partisanType !== 'partisan' && getElectionDates) {
    // priorElectionDates = await sails.helpers.ballotready.getElectionDatesPosition(
    //   slug,
    //   positionId,
    // );

    // todo: replace this with logic from the candidate-victory.js
    // to get election dates from the position object.
    priorElectionDates = await sails.helpers.ballotready.getElectionDates(
      slug,
      officeName,
      zip,
      race?.position?.level,
    );
    // sails.helpers.log('priorElectionDates', priorElectionDates);
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
  return data;
}

module.exports = getRaceDetails;
