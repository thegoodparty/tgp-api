const crypto = require('crypto');
const { isBoolean } = require('lodash');
const slugify = require('slugify');
const { exits } = require('./extract-location-ai');

module.exports = {
  inputs: {
    row: {
      type: 'json',
    },
  },

  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { row } = inputs;

    try {
      let {
        position_name,
        state,
        race_id,
        is_primary,
        is_judicial,
        sub_area_name,
        sub_area_value,
        filing_periods,
        election_day,
        normalized_position_name,
        level,
      } = row;

      let isPrimary = false;
      if (isBoolean(is_primary)) {
        isPrimary = is_primary;
      } else {
        isPrimary = is_primary && is_primary.toLowerCase() === 'true';
      }

      let isJudicial = false;
      if (isBoolean(is_judicial)) {
        isJudicial = is_judicial;
      } else {
        isJudicial = is_judicial && is_judicial.toLowerCase() === 'true';
      }

      console.log(`extracting location for ${position_name}`);

      let { name } = await sails.helpers.ballotready.extractLocation(row);
      console.log(`extracted location name: ${name}. level is: ${level}`);

      const exists = await BallotRace.findOne({
        ballotId: race_id,
      });
      if (!exists) {
        console.log('ballotRace does not exist. adding it...');
        const hashId = await randomHash();
        const ballotHashId = await sails.helpers.ballotready.encodeId(
          race_id,
          'PositionElection',
        );

        const dates = extractDates(filing_periods);
        if (dates) {
          console.log('dates.startDate', dates.startDate);
          console.log('dates.endDate', dates.endDate);
          row.filing_date_start = dates.startDate;
          row.filing_date_end = dates.endDate;
        }
        const electionDate = election_day
          ? new Date(election_day).getTime()
          : 0;

        if (level === 'county') {
          console.log('calling addCountyRace...');
          await addCountyRace(
            name,
            state,
            row,
            race_id,
            position_name,
            hashId,
            ballotHashId,
            level,
            isPrimary,
            isJudicial,
            sub_area_name,
            sub_area_value,
            normalized_position_name,
            electionDate,
          );
        } else if (level === 'state' || level === 'federal') {
          console.log('adding state/federal ballotrace...');
          try {
            await BallotRace.create({
              hashId,
              ballotId: race_id,
              ballotHashId,
              state,
              data: row,
              level,
              isPrimary,
              isJudicial,
              subAreaName: sub_area_name ? sub_area_name : '',
              subAreaValue: sub_area_value ? sub_area_value : '',
              electionDate,
              positionSlug: slugify(normalized_position_name, {
                lower: true,
              }),
            });
          } catch (e) {
            console.log('error in ballotRace.create', e);
            await sails.helpers.slack.errorLoggerHelper(
              `error creating ballotRace for federal/state. state: ${state}`,
              {},
            );
          }
        } else {
          // level is one of: city, town, township, village, local, regional
          // in some instances local can be a county
          console.log('calling addCityRace...');
          await addCityRace(
            name,
            state,
            row,
            race_id,
            position_name,
            hashId,
            ballotHashId,
            level,
            isPrimary,
            isJudicial,
            sub_area_name,
            sub_area_value,
            normalized_position_name,
            electionDate,
          );
        }
      }
    } catch (e) {
      console.log('error in add-race', e);
      return exits.badRequest({
        message: 'Error in addRace',
        error: JSON.stringify(e),
      });
    }

    return exits.success({ message: 'done' });
  },
};

async function addCityRace(
  name,
  state,
  row,
  race_id,
  position_name,
  hashId,
  ballotHashId,
  level,
  isPrimary,
  isJudicial,
  sub_area_name,
  sub_area_value,
  normalized_position_name,
  electionDate,
) {
  console.log('municipality level', level);
  let municipalities;
  if (name !== '') {
    municipalities = await Municipality.find({
      name,
      state,
    });
  }
  if (municipalities && municipalities.length > 0) {
    let muni = municipalities[0];
    console.log('municipality exists. adding ballotRace');
    try {
      await BallotRace.create({
        hashId,
        ballotId: race_id,
        ballotHashId,
        state,
        data: row,
        municipality: muni.id,
        level,
        isPrimary,
        isJudicial,
        subAreaName: sub_area_name ? sub_area_name : '',
        subAreaValue: sub_area_value ? sub_area_value : '',
        electionDate,
        positionSlug: slugify(normalized_position_name, {
          lower: true,
        }),
      });
    } catch (e) {
      console.log('error in ballotRace.create', e);
      await sails.helpers.slack.errorLoggerHelper(
        `error creating ballotRace for municipality. name: ${name}, state: ${state}`,
        {},
      );
    }
  } else {
    console.log(
      'municipality does not exist. using ai to refine municipality name',
    );
    console.log(`calling extractLocationAi with level ${level}`);

    const locationResp = await sails.helpers.ballotready.extractLocationAi(
      position_name + ' - ' + state,
      level,
    );

    let cityName;
    let countyName;
    if (locationResp?.level) {
      if (locationResp.level === 'county') {
        // sometimes 'local' or 'regional' can be a county
        countyName = locationResp.county;
        await addCountyRace(
          countyName,
          state,
          row,
          race_id,
          position_name,
          hashId,
          ballotHashId,
          'county',
          isPrimary,
          isJudicial,
          sub_area_name,
          sub_area_value,
          normalized_position_name,
          electionDate,
        );
        return exits.success({ message: 'done' });
      } else {
        if (
          locationResp.county &&
          locationResp.hasOwnProperty(locationResp.level)
        ) {
          cityName = locationResp[locationResp.level];
          countyName = locationResp.county;
        }
      }
    }

    if (cityName && cityName !== '') {
      let formattedCityName = cityName.replace(' City', '');
      formattedCityName = formattedCityName.replace(' Township', '');
      formattedCityName = formattedCityName.replace(' Town', '');
      formattedCityName = formattedCityName.replace(' Village', '');

      const aiMunicipalities = await Municipality.find({
        or: [{ name: formattedCityName }, { name: cityName }],
        state,
        // type: level,
      });
      if (aiMunicipalities && aiMunicipalities.length > 0) {
        console.log('ai municipality exists. adding ballotRace');
        let aiMunicipality = aiMunicipalities[0];
        try {
          await BallotRace.create({
            hashId,
            ballotId: race_id,
            ballotHashId,
            state,
            data: row,
            municipality: aiMunicipality.id,
            level,
            isPrimary,
            isJudicial,
            subAreaName: sub_area_name ? sub_area_name : '',
            subAreaValue: sub_area_value ? sub_area_value : '',
            electionDate,
            positionSlug: slugify(normalized_position_name, {
              lower: true,
            }),
          });
        } catch (e) {
          console.log('error in ballotRace.create', e);
          await sails.helpers.slack.errorLoggerHelper(
            `error creating ballotRace with ai municipality. name: ${formattedCityName}, state: ${state}`,
            {},
          );
        }
      } else {
        console.log('ai municipality does not exist. attempting to create it.');
        // If the municipality does not exist, then add it.
        // Same with the county.
        // and then add the ballotRace
        let county;
        let city;
        if (countyName && countyName !== '' && cityName && cityName !== '') {
          let formattedCountyName = countyName.replace(' County', '');
          formattedCountyName = formattedCountyName.replace(' Parish', '');
          formattedCountyName = formattedCountyName.replace(' Borough', '');
          formattedCountyName = formattedCountyName.replace(' City', '');

          const counties = await County.find({
            or: [{ name: formattedCountyName }, { name: countyName }],
            state,
          });

          if (counties && counties.length > 0) {
            console.log('county exists. using it.', countyName);
            county = counties[0];
          } else {
            console.log('county does not exist. adding county.', countyName);
            // add the County.
            let countyRow = {
              name: countyName,
              county_full: countyName,
              state_id: state,
              aiExtracted: true,
            };
            county = await sails.helpers.ballotready.addCounty(
              formattedCountyName,
              state,
              countyRow,
            );
          }
          if (county) {
            // add the City.
            // Note: we don't add the formattedCityName to the database
            // because we want to distinguish between a city and town and township with the same name.
            console.log('adding city', cityName);
            let cityRow = {
              city: cityName,
              state_id: state,
              county_name: countyName,
              aiExtracted: true,
            };
            city = await sails.helpers.ballotready.addCity(
              cityRow,
              cityName,
              county.id,
              state,
              formattedCountyName,
              level,
            );
          }
          if (city) {
            console.log('adding ballotRace with newly created city and county');
            try {
              await BallotRace.create({
                hashId,
                ballotId: race_id,
                ballotHashId,
                state,
                data: row,
                municipality: city.id,
                level,
                isPrimary,
                isJudicial,
                subAreaName: sub_area_name ? sub_area_name : '',
                subAreaValue: sub_area_value ? sub_area_value : '',
                electionDate,
                positionSlug: slugify(normalized_position_name, {
                  lower: true,
                }),
              });
            } catch (e) {
              console.log('error in ballotRace.create', e);
              await sails.helpers.slack.errorLoggerHelper(
                `error creating ballotRace with city. name: ${cityName}, state: ${state}`,
                {},
              );
            }
          }
        } else {
          await sails.helpers.slack.errorLoggerHelper(
            `municipality does not exist. could not extract valid municipality. office: ${position_name} ai city name: ${formattedCityName}, state: ${state}`,
            {},
          );
        }
      }
    }
  }
}

async function addCountyRace(
  name,
  state,
  row,
  race_id,
  position_name,
  hashId,
  ballotHashId,
  level,
  isPrimary,
  isJudicial,
  sub_area_name,
  sub_area_value,
  normalized_position_name,
  electionDate,
) {
  let countyExists;
  if (name !== '') {
    countyExists = await County.findOne({
      name,
      state,
    });
  }
  if (countyExists) {
    console.log('county exists. adding ballotRace');
    try {
      await BallotRace.create({
        hashId,
        ballotId: race_id,
        ballotHashId,
        state,
        data: row,
        county: countyExists.id,
        level,
        isPrimary,
        isJudicial,
        subAreaName: sub_area_name ? sub_area_name : '',
        subAreaValue: sub_area_value ? sub_area_value : '',
        electionDate,
        positionSlug: slugify(normalized_position_name, {
          lower: true,
        }),
      });
    } catch (e) {
      console.log('error in ballotRace.create', e);
      await sails.helpers.slack.errorLoggerHelper(
        `error creating ballotRace with county. name: ${name}, state: ${state}`,
        {},
      );
    }
  } else {
    console.log('county does not exist. using ai to refine county name');
    let locationResp = await sails.helpers.ballotready.extractLocationAi(
      position_name + ' - ' + state,
      level,
    );

    console.log('locationResp', locationResp);

    let countyName;
    if (locationResp?.level) {
      if (locationResp.level === 'county') {
        countyName = locationResp.county;
      }
    }

    if (countyName && countyName !== '') {
      let formattedCountyName = countyName.replace(' County', '');
      formattedCountyName = formattedCountyName.replace(' Parish', '');
      formattedCountyName = formattedCountyName.replace(' Borough', '');
      formattedCountyName = formattedCountyName.replace(' City', '');

      const aiCounties = await County.find({
        or: [{ name: formattedCountyName }, { name: countyName }],
        state,
      });

      if (aiCounties && aiCounties.length > 0) {
        console.log('ai county exists. adding ballotRace');
        let aiCounty = aiCounties[0];
        try {
          await BallotRace.create({
            hashId,
            ballotId: race_id,
            ballotHashId,
            state,
            data: row,
            county: aiCounty.id,
            level,
            isPrimary,
            isJudicial,
            subAreaName: sub_area_name ? sub_area_name : '',
            subAreaValue: sub_area_value ? sub_area_value : '',
            electionDate,
            positionSlug: slugify(normalized_position_name, {
              lower: true,
            }),
          });
        } catch (e) {
          console.log('error in ballotRace.create', e);
          // if error code is E_UNIQUE then dont throw slack error.
          if (e.code !== 'E_UNIQUE') {
            await sails.helpers.slack.errorLoggerHelper(
              `error creating ballotRace with ai county. name: ${formattedCountyName}, state: ${state}`,
              {},
            );
          }
        }
      } else {
        console.log('county does not exist. adding county.', countyName);
        let county;
        if (countyName && countyName !== '') {
          let countyRow = {
            name: formattedCountyName,
            county_full: countyName,
            state_id: state,
            aiExtracted: true,
          };
          county = await sails.helpers.ballotready.addCounty(
            countyName,
            state,
            countyRow,
          );
        }

        if (county) {
          console.log('adding ballotRace with newly created county');
          try {
            await BallotRace.create({
              hashId,
              ballotId: race_id,
              ballotHashId,
              state,
              data: row,
              county: county.id,
              level,
              isPrimary,
              isJudicial,
              subAreaName: sub_area_name ? sub_area_name : '',
              subAreaValue: sub_area_value ? sub_area_value : '',
              electionDate,
              positionSlug: slugify(normalized_position_name, {
                lower: true,
              }),
            });
          } catch (e) {
            console.log('error in ballotRace.create', e);
            // if error code is E_UNIQUE then dont throw slack error.
            if (e.code !== 'E_UNIQUE') {
              await sails.helpers.slack.errorLoggerHelper(
                `error creating ballotRace with ai county. name: ${formattedCountyName}, state: ${state}`,
                {},
              );
            }
          }
        }
      }
    }
  }
}

async function randomHash() {
  const hashId = crypto.randomBytes(3).toString('hex').substr(0, 8);
  const existing = await BallotRace.findOne({ hashId });
  if (existing) {
    console.log('duplicate hash', hashId);
    return await randomHash();
  }
  return hashId;
}

function extractDates(str) {
  // the string format is [{"notes"=>nil, "end_on"=>"2024-05-10", "start_on"=>"2024-05-06"}] or []
  // Replace '=>' with ':' to make it a valid JSON string
  if (!str || str === '' || str === '[]') {
    return false;
  }
  try {
    let validJsonString = str.replace(/=>/g, ':');
    validJsonString = validJsonString.replace(/\\\"/g, '"');
    validJsonString = validJsonString.replace(/nil/g, 'null');

    // Parse the string as JSON
    const jsonObject = JSON.parse(validJsonString);

    // Extract the 'start_on' and 'end_on' dates
    const startDate = jsonObject[0].start_on;
    const endDate = jsonObject[0].end_on;

    return { startDate, endDate };
  } catch (e) {
    console.log(`error parsing dates. str: ${str}.`, e);
    return false;
  }
}
