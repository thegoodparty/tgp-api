const crypto = require('crypto');
const { isBoolean } = require('lodash');
const slugify = require('slugify');

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
      const {
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

      console.log(`inserting ${position_name} into db`);

      let { name, level } = await sails.helpers.ballotready.extractLocation(
        row,
      );

      console.log(`extracted name: ${name}, level: ${level}`);

      // if (name === '') {
      //   console.log('position_name', position_name);
      //   console.log('original level', row.level);
      //   console.log('name', name);
      //   console.log('level', level);
      //   console.log('---');
      // }
      const exists = await BallotRace.findOne({
        ballotId: race_id,
      });
      if (!exists && name !== '') {
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

        level = await sails.helpers.ballotready.getRaceLevel(
          row.level.toLowerCase(),
        );

        if (level === 'county') {
          const countyExists = await County.findOne({
            name,
            state,
          });
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
                `error in ballotRace.create. name: ${name}, state: ${state}`,
                {},
              );
            }
          } else {
            // todo: we need to extract county using the ai.
            // right here.
            const locationData =
              await sails.helpers.ballotready.extractLocationAi(
                position_name + ' - ' + state,
                level,
              );
            if (locationData) {
              const cityName = locationData?.city;
              const countyName = locationData?.county;
              if (cityName) {
                await sails.helpers.slack.errorLoggerHelper(
                  `ai found city where county was expected! skipping! office: ${position_name} name: ${cityName}, state: ${state}`,
                  {},
                );
                return exits.success({
                  message: 'ai found city where county was expected! skipping!',
                });
              }

              const aiCounties = await County.find({
                name: countyName,
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
                  await sails.helpers.slack.errorLoggerHelper(
                    `error in ballotRace.create. name: ${name}, state: ${state}`,
                    {},
                  );
                }
              } else {
                console.log('county does not exist. skipping!');
                await sails.helpers.slack.errorLoggerHelper(
                  `county does not exist. skipping! name: ${countyName}, state: ${state}`,
                  {},
                );
              }
            }
          }
        } else if (level === 'state' || level === 'federal') {
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
              `error in ballotRace.create. name: ${name}, state: ${state}`,
              {},
            );
          }
        } else {
          console.log('municipality level', level);
          const municipalities = await Municipality.find({
            name,
            state,
          });
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
                `error in ballotRace.create. name: ${name}, state: ${state}`,
                {},
              );
            }
          } else {
            console.log(
              'municipality does not exist. using ai to refine municipality name',
            );
            console.log(`calling extractLocationAi with level ${level}`);
            const locationData =
              await sails.helpers.ballotready.extractLocationAi(
                position_name + ' - ' + state,
                level,
              );
            if (locationData) {
              const cityName = locationData?.city;
              const countyName = locationData?.county;
              if (countyName) {
                await sails.helpers.slack.errorLoggerHelper(
                  `ai found county where city was expected! skipping! office: ${position_name} name: ${countyName}, state: ${state}`,
                  {},
                );
                return exits.success({
                  message: 'ai found county where city was expected! skipping!',
                });
              }

              const aiMunicipalities = await Municipality.find({
                name: cityName,
                state,
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
                    `error in ballotRace.create. name: ${name}, state: ${state}`,
                    {},
                  );
                }
              } else {
                console.log('ai municipality does not exist. skipping!');
                // todo: if the municipality looks correct, then add them to the db.
                await sails.helpers.slack.errorLoggerHelper(
                  `municipality does not exist. skipping! office: ${position_name} ai city name: ${cityName}, state: ${state}`,
                  {},
                );
                return exits.success({
                  message: 'ai municipality does not exist. skipping!',
                });
              }
            }
          }
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
