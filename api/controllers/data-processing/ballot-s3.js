const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

const appBase = sails.config.custom.appBase || sails.config.appBase;

AWS.config.update({
  region: 'us-west-2',
  accessKeyId,
  secretAccessKey,
});

// Define the desired order of columns
const desiredOrder = [
  'first_name',
  'last_name',
  'state',
  'parsedLocation',
  'normalized_position_name',
  'parties',
  'email',
  'phone',
];

const s3Bucket = 'goodparty-ballotready';

let csvFilePath = path.join(__dirname, '../../../data/candidates');

const s3 = new AWS.S3();

module.exports = {
  inputs: {
    addToSheets: {
      type: 'boolean',
      defaultsTo: true,
    },
    allFiles: {
      type: 'boolean',
      defaultsTo: false,
    },
    maxRows: {
      type: 'number',
      defaultsTo: 0,
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
    try {
      let files = [];
      if (inputs.allFiles === true) {
        files = getAllCandidateFiles(s3Bucket, 200);
        for (const file of files) {
          const objectKey = file?.Key;
          const localFilePath = `${csvFilePath}/${objectKey}`;
          await downloadFile(s3Bucket, objectKey, localFilePath);
          let rows = await parseFile(localFilePath);
          if (rows) {
            console.log(`rows: ${rows.length}`);
            await writeDb(rows);
          }
        }
      } else {
        files = await getLatestFiles(s3Bucket, 200);
        const objectKey = findLatestCandidatesFile(files);
        const localFilePath = `${csvFilePath}/${objectKey}`;
        await downloadFile(s3Bucket, objectKey, localFilePath);
        let rows = await parseFile(localFilePath);
        if (inputs?.maxRows && inputs.maxRows > 0) {
          rows = rows.slice(0, inputs.maxRows);
        }

        if (
          inputs.addToSheets === true &&
          appBase === 'https://goodparty.org'
        ) {
          const sheetId = '1A1p8e3I6_cMnti1DgZPl-NqoKHyoLoR_dvslVqAqXzg';
          await sails.helpers.google.uploadSheets(
            localFilePath,
            sheetId,
            objectKey,
          );
        }

        if (rows) {
          console.log(`rows: ${rows.length}`);
          await writeDb(rows);
        }
      }

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('error at data-processing/ballot-s3');
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'data-processing/ballot-s3',
        e,
      );
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};

async function addNewCandidate(row) {
  let ballotElection;

  try {
    ballotElection = await BallotElection.findOne({
      ballotId: row.election_id,
    });
  } catch (e) {
    console.log('error finding ballotElection', e);
  }
  if (!ballotElection) {
    console.log('ballotElection not found');
    const encodedElectionId = await sails.helpers.ballotready.encodeId(
      row.election_id,
      'Election',
    );
    const election = await sails.helpers.ballotready.getElection(
      encodedElectionId,
    );
    console.log('got election', election);
    let electionData = {
      electionId: election.databaseId,
      electionDay: election.electionDay,
      state: election.state,
      data: { ...election },
    };

    console.log('adding election', electionData);
    await sails.helpers.ballotready.addElection(electionData);

    ballotElection = await BallotElection.findOne({
      ballotId: row.election_id,
    });
  }

  if (!ballotElection) {
    await sendSlackNotification(
      'BallotElection not found',
      `BallotElection not found for election ${row.election_id}`,
      'dev',
    );
  }

  let ballotPosition;
  let positionId = row.position_id;
  try {
    ballotPosition = await BallotPosition.findOne({
      ballotId: positionId,
    });
  } catch (e) {
    console.log('error finding ballotPosition', e);
  }
  if (!ballotPosition) {
    console.log('ballotPosition not found');

    const encodedPositionId = await sails.helpers.ballotready.encodeId(
      positionId,
      'Position',
    );
    const position = await sails.helpers.ballotready.getPosition(
      encodedPositionId,
    );
    console.log('got position', position);
    let positionData = {
      positionId: position.databaseId,
      electionId: ballotElection.id,
      state: position.state,
      ballotElection: ballotElection.id,
      data: { ...position },
    };

    console.log('adding position', positionData);
    await sails.helpers.ballotready.addPosition(positionData);

    ballotPosition = await BallotPosition.findOne({
      ballotId: positionId,
    });
  }

  if (!ballotPosition) {
    await sendSlackNotification(
      'BallotPosition not found',
      `BallotPosition not found for position ${row.position_id}`,
      'dev',
    );
  }

  let ballotRace = await BallotRace.findOne({
    ballotId: row.race_id,
  });
  if (!ballotRace) {
    console.log('ballotRace not found');
    // console.log('getting race', row.race_id);
    // the row.race_id is the Database ID but the ballotready API uses the hashed ID
    const raceId = row.race_id;
    const encodedRaceId = await sails.helpers.ballotready.encodeId(
      raceId,
      'PositionElection',
    );
    const race = await sails.helpers.ballotready.getRace(encodedRaceId);
    console.log('got race data from ballotReady api', race);

    let filingPeriods = [];
    for (const fp of race.filingPeriods) {
      filingPeriods.push({
        start_on: fp.startOn,
        end_on: fp.endOn,
      });
    }
    // for now we match the format of the existing filing_periods field (from csv parse in seed/races)
    // but we may want to change this to an array of objects in the future
    // would need to fix it here and in seed/races and truncate/rerun the seed.
    let fpString = JSON.stringify(filingPeriods);
    fpString = fpString.replace(/"/g, '\\"').replace(/:/g, '=>');

    let raceData = {
      position_name: race.position.name,
      state: race.position.state,
      race_id: race.databaseId,
      is_primary: race.isPrimary,
      is_judicial: race.position.judicial,
      sub_area_name: race.position.subAreaName,
      sub_area_value: race.position.subAreaValue,
      filing_periods: fpString,
      election_day: race.election.electionDay,
      normalized_position_name: race.position.normalizedPosition.name,
      level: race.position.level,
    };

    console.log('adding race', raceData);
    await sails.helpers.ballotready.addRace(raceData);

    ballotRace = await BallotRace.findOne({
      ballotId: row.race_id,
    });
  }

  if (!ballotRace) {
    await sendSlackNotification(
      'BallotRace not found',
      `BallotRace not found for race ${row.race_id}`,
      'dev',
    );
  }

  let campaign;
  if (row?.email || row?.phone) {
    let campaignSearch = {
      or: [],
    };
    if (row?.email) {
      campaignSearch.or.push({ email: row.email });
    }
    if (row?.phone) {
      campaignSearch.or.push({ phone: row.phone });
    }

    let user;
    try {
      user = await User.findOne(campaignSearch);
    } catch (e) {
      // don't notify slack because this is expected
      console.log('candidate does not have a goodparty campaign.', e);
    }
    if (user && user?.id) {
      try {
        campaign = await Campaign.findOne({ user: user.id });
      } catch (e) {
        console.log('error finding campaign', e);
        await sendSlackNotification(
          'Error finding campaign',
          `Error finding campaign for user ${user.id}`,
          'dev',
        );
      }
    }
  }

  // fields we don't need to search, sort, filter on.
  let data = {
    subAreaName: row.sub_area_name,
    subAreaValue: row.sub_area_value,
    subAreaNameSecondary: row.sub_area_name_secondary,
    subAreaValueSecondary: row.sub_area_value_secondary,
    email2: row.email2,
    phone2: row.phone2,
    urls: row.urls,
    imageUrl: row.image_url,
    suffix: row.suffix,
    nickname: row.nickname,
    middleName: row.middle_name,
    numberOfSeats: row.number_of_seats,
    geofenceIsNotExact: row.geofence_is_not_exact,
    geofenceId: row.geofence_id,
    normalizedPositionId: row.normalized_position_id,
    mtfcc: row.mtfcc,
    geoId: row.geo_id,
    candidacyId: row.candidacy_id,
    candidacyCreatedAt: row.candidacy_created_at,
    candidacyUpdatedAt: row.candidacy_updated_at,
  };

  const isPrimary = row.is_primary && row.is_primary.toLowerCase() === 'true';
  const isJudicial =
    row.is_judicial && row.is_judicial.toLowerCase() === 'true';
  const isRetention =
    row.is_retention && row.is_retention.toLowerCase() === 'true';
  const isRunoff = row.is_runoff && row.is_runoff.toLowerCase() === 'true';
  const isUnexpired =
    row.is_unexpired && row.is_unexpired.toLowerCase() === 'true';

  const candidateHashId = await sails.helpers.ballotready.encodeId(
    row.candidate_id,
    'Candidate',
  );

  // fields we may wish to search, sort, filter on.
  candidateData = {
    firstName: row.first_name,
    lastName: row.last_name,
    data: data,
    state: row.state,
    parsedLocation: row.parsedLocation,
    normalizedPositionName: row.normalized_position_name,
    parties: row.parties,
    email: row?.email ? row.email : '',
    phone: row?.phone ? row.phone : '',
    ballotHashId: candidateHashId,
    candidateId: row.candidate_id,
    positionId: row.position_id,
    electionId: row.election_id,
    raceId: row.race_id,
    electionName: row.election_name,
    electionDay: row.election_day,
    electionResult: row.election_result,
    positionName: row.position_name,
    level: row?.level ? row.level : '',
    tier: row.tier,
    isJudicial: isJudicial,
    isRetention: isRetention,
    isPrimary: isPrimary,
    isRunoff: isRunoff,
    isUnexpired: isUnexpired,
  };

  if (campaign) {
    candidateData.campaign = campaign.id;
  }

  console.log('candidateData', candidateData);

  let candidate;
  try {
    candidate = await BallotCandidate.create(candidateData).fetch();
  } catch (e) {
    // check if error is due to unique constraint
    if (e.code === 'E_UNIQUE') {
      console.log('candidate already exists');
      // can the m2m associations below get duplicated ?
      // if so we should return here.
      // return;
    } else {
      console.log('error creating candidate', e);
      await sendSlackNotification(
        'Error creating candidate',
        `Error creating candidate ${row.candidate_id}. ${e}`,
        'dev',
      );
    }
  }

  if (candidate && candidate?.id) {
    if (ballotElection) {
      try {
        await BallotCandidate.addToCollection(
          candidate.id,
          'elections',
          ballotElection.id,
        );
      } catch (e) {
        console.log('error making election relationship', e);
      }
    }
    if (ballotPosition) {
      try {
        await BallotCandidate.addToCollection(
          candidate.id,
          'positions',
          ballotPosition.id,
        );
      } catch (e) {
        console.log('error making position relationship', e);
      }
    }
    if (ballotRace) {
      try {
        await BallotCandidate.addToCollection(
          candidate.id,
          'races',
          ballotRace.id,
        );
      } catch (e) {
        console.log('error making race relationship', e);
      }
    }
  }
}

async function writeDb(rows) {
  console.log('total rows', rows.length);
  for (const row of rows) {
    let searchCriteria = {
      or: [{ candidateId: row.candidate_id }],
    };
    if (row?.email && row.email !== '') {
      searchCriteria.or.push({ email: row.email });
    }
    if (row?.phone && row.phone !== '') {
      searchCriteria.or.push({ phone: row.phone });
    }
    console.log('checking for ', searchCriteria);
    let existingCandidate;
    try {
      existingCandidate = await BallotCandidate.findOne(searchCriteria);
    } catch (e) {
      console.log('error finding candidate', e);
      await sendSlackNotification(
        'Error finding candidate',
        `Error finding candidate ${row.candidate_id}`,
        'dev',
      );
    }
    if (existingCandidate) {
      // todo: consider updating candidate if data has changed.
      // for example if the candidate has entered a new race
      console.log('candidate already exists');
      continue;
    } else {
      console.log('adding new candidate', row.candidate_id);
      try {
        await addNewCandidate(row);
      } catch (e) {
        console.log('uncaught error adding candidate', e);
        await sendSlackNotification(
          `Uncaught Error adding candidate. error: ${e}`,
          `Uncaught Error adding candidate ${row.candidate_id}. error: ${e}`,
          'dev',
        );
      }
    }
    await sleep(5000);
  }
}

async function getAllCandidateFiles(bucket, maxKeys) {
  try {
    const params = {
      Bucket: bucket,
      MaxKeys: maxKeys,
    };

    const data = await s3.listObjectsV2(params).promise();

    // Sort the files by LastModified date
    const sortedFiles = data.Contents.sort((a, b) => {
      return new Date(b.LastModified) - new Date(a.LastModified);
    });

    candidateFiles = [];
    for (let i = 0; i < sortedFiles.length; i++) {
      const key = sortedFiles[i]?.Key;
      if (key?.startsWith('candidacies_v3')) {
        candidateFiles.push(key);
      }
    }
    return candidateFiles;
  } catch (error) {
    console.error('Error fetching files: ', error);
    throw error;
  }
}

async function getLatestFiles(bucket, maxKeys) {
  try {
    const params = {
      Bucket: bucket,
      MaxKeys: maxKeys,
    };

    const data = await s3.listObjectsV2(params).promise();

    // Sort the files by LastModified date
    const sortedFiles = data.Contents.sort((a, b) => {
      return new Date(b.LastModified) - new Date(a.LastModified);
    });

    // Get the latest files
    return sortedFiles.slice(0, 4);
  } catch (error) {
    console.error('Error fetching files: ', error);
    throw error;
  }
}

function findLatestCandidatesFile(files) {
  for (let i = 0; i < files.length; i++) {
    const key = files[i]?.Key;
    if (key?.startsWith('candidacies_v3')) {
      return key;
    }
  }
  return null;
}

function downloadFile(bucket, key, filePath) {
  const params = {
    Bucket: bucket,
    Key: key,
  };

  const file = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    s3.getObject(params)
      .createReadStream()
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .pipe(file);
  });
}
async function parseFile(filePath) {
  const rows = [];
  let headers = [];
  let finished = false;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('headers', (headerList) => {
      // Capture the headers
      const orderedHeaders = [
        ...desiredOrder,
        ...headerList.filter((h) => !desiredOrder.includes(h)),
      ];

      headers = orderedHeaders;
    })
    .on('data', (row) => {
      (async () => {
        // Modify the "parties" column
        if (row.parties) {
          const match = row.parties.match(/"name"=>\s*"([^"]+)"/);
          if (match && match[1]) {
            row.parties = match[1];
          }
        }
        // modify urls columns
        if (row.urls) {
          try {
            const validJSON = row.urls.replace(/=>/g, ':');
            const url = JSON.parse(validJSON);
            let parsedUrl = '';
            url.forEach((u) => {
              parsedUrl += `${u.website} `;
            });
            row.urls = parsedUrl;
          } catch (e) {
            console.log('error parsing urls', e);
            row.urls = '';
          }
        }
        if (row.parties !== 'Democratic' && row.parties !== 'Republican') {
          const { name } = await sails.helpers.ballotready.extractLocation(row);
          row.parsedLocation = name ? name.replace(/\"+/g, '') : ''; //remove quotes
          row.normalizedPosition = row.normalizedPosition
            ? row.normalizedPosition.replace(/\"+/g, '')
            : ''; //remove quotes
          row.positionName = row.positionName
            ? row.positionName.replace(/\"+/g, '')
            : ''; //remove quotes

          const reorderedRow = {};
          headers.forEach((header) => {
            reorderedRow[header] = row[header] || '';
          });

          // Add the modified row to the rows array
          rows.push(reorderedRow);
        }
      })();
    })
    .on('end', () => {
      // Manually construct the CSV
      const updatedCsv = rowsToCsv(headers, rows);

      // Save the updated CSV to the same file
      try {
        fs.writeFile(filePath, updatedCsv, (err) => {
          if (err) {
            console.error('Error writing the file', err);
          } else {
            console.log('File successfully written');
          }
        });
      } catch (e) {
        console.log('error writing file', e);
      }
      finished = true;
    });
  while (finished === false) {
    await sleep(1000);
  }
  return rows;
}

function rowsToCsv(headers, rows) {
  // Join headers
  const csvString = headers.join(',') + '\n';

  // Join rows
  return rows.reduce((csv, row) => {
    const rowString = headers
      .map((header) => {
        const cell = row[header] || '';
        // Add quotes only if necessary
        return /[\s,]/.test(cell) ? `"${cell}"` : cell;
      })
      .join(',');

    return csv + rowString + '\n';
  }, csvString);
}

async function sendSlackNotification(title, message, channel) {
  await sails.helpers.slack.slackHelper(
    simpleSlackMessage(title, message),
    channel,
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simpleSlackMessage(text, body) {
  return {
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: body,
        },
      },
    ],
  };
}
