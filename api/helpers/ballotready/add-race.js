const crypto = require('crypto');
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
    await insertIntoDatabase(row);
  },
};

async function insertIntoDatabase(row) {
  console.log('entered insertIntoDatabase', row);

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
    const isPrimary = is_primary && is_primary.toLowerCase() === 'true';
    const isJudicial = is_judicial && is_judicial.toLowerCase() === 'true';

    console.log(`inserting ${position_name} into db`);

    const { name, level } = await sails.helpers.ballotready.extractLocation(
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
      const dates = extractDates(filing_periods);
      if (dates) {
        row.filing_date_start = dates.startDate;
        row.filing_date_end = dates.endDate;
      }
      const electionDate = election_day ? new Date(election_day).getTime() : 0;

      if (level === 'county') {
        const countyExists = await County.findOne({
          name,
          state,
        });
        if (countyExists) {
          console.log('county exists. adding ballotRace');
          await BallotRace.create({
            hashId,
            ballotId: race_id,
            state,
            data: row,
            county: countyExists.id,
            level,
            isPrimary,
            isJudicial,
            subAreaName: sub_area_name,
            subAreaValue: sub_area_value,
            electionDate,
            positionSlug: slugify(normalized_position_name, {
              lower: true,
            }),
          });
          count++;
        } else {
          console.log('county does not exist. skipping!');
        }
      } else if (level === 'state' || level === 'federal') {
        await BallotRace.create({
          hashId,
          ballotId: race_id,
          state,
          data: row,
          level,
          isPrimary,
          isJudicial,
          subAreaName: sub_area_name,
          subAreaValue: sub_area_value,
          electionDate,
          positionSlug: slugify(normalized_position_name, {
            lower: true,
          }),
        });
        count++;
      } else {
        const municipalityExists = await Municipality.findOne({
          name,
          state,
        });
        if (municipalityExists) {
          console.log('municipality exists. adding ballotRace');
          await BallotRace.create({
            hashId,
            ballotId: race_id,
            state,
            data: row,
            municipality: municipalityExists.id,
            level,
            isPrimary,
            isJudicial,
            subAreaName: sub_area_name,
            subAreaValue: sub_area_value,
            electionDate,
            positionSlug: slugify(normalized_position_name, {
              lower: true,
            }),
          });
          count++;
        } else {
          console.log('municipality does not exist. skipping!');
        }
      }
    }
  } catch (e) {
    console.log('error in insertIntoDb', e);
  }

  return exits.success({ message: 'done' });
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
    validJsonString = validJsonString.replace(/nil/g, 'null');

    // Parse the string as JSON
    const jsonObject = JSON.parse(validJsonString);

    // Extract the 'start_on' and 'end_on' dates
    const startDate = jsonObject[0].start_on;
    const endDate = jsonObject[0].end_on;

    return { startDate, endDate };
  } catch (e) {
    console.log('error', e);
    return false;
  }
}
