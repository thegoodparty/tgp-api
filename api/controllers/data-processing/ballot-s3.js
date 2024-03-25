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
  region: 'eu-west-2',
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
      const files = await getLatestFiles(s3Bucket, 200);
      const objectKey = findLatestCandidatesFile(files);
      const localFilePath = `${csvFilePath}/${objectKey}`;
      await downloadFile(s3Bucket, objectKey, localFilePath);
      let rows = await parseFile(localFilePath);

      if (inputs.addToSheets === true && appBase === 'https://goodparty.org') {
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
  const ballotElection = await BallotElection.findOne({
    ballotId: row.election_id,
  });
  if (!ballotElection) {
    console.log('ballotElection not found');
    await sendSlackNotification(
      'BallotElection not found',
      `BallotElection not found for election ${row.election_id}`,
      'bot-dev',
    );
  }

  const ballotPosition = await BallotPosition.findOne({
    ballotId: row.position_id,
  });
  if (!ballotPosition) {
    console.log('ballotPosition not found');
    await sendSlackNotification(
      'BallotPosition not found',
      `BallotPosition not found for position ${row.position_id}`,
      'bot-dev',
    );
  }

  const ballotRace = await BallotRace.findOne({
    ballotId: row.race_id,
  });
  if (!ballotRace) {
    console.log('ballotRace not found');
    await sendSlackNotification(
      'BallotRace not found',
      `BallotRace not found for race ${row.race_id}`,
      'bot-dev',
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
          'bot-dev',
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

  // fields we may wish to search, sort, filter on.
  candidateData = {
    firstName: row.first_name,
    lastName: row.last_name,
    data: data,
    state: row.state,
    parsedLocation: row.parsedLocation,
    normalizedPositionName: row.normalized_position_name,
    parties: row.parties,
    email: row.email,
    phone: row.phone,
    candidateId: row.candidate_id,
    positionId: row.position_id,
    electionId: row.election_id,
    raceId: row.race_id,
    electionName: row.election_name,
    electionDay: row.election_day,
    electionResult: row.election_result,
    positionName: row.position_name,
    level: row.level,
    tier: row.tier,
    isJudicial: row.is_judicial,
    isRetention: row.is_retention,
    isPrimary: row.is_primary,
    isRunoff: row.is_runoff,
    isUnexpired: row.is_unexpired,
  };

  // add relationships
  if (ballotElection) {
    candidateData.elections = [ballotElection.id];
  }
  if (ballotPosition) {
    candidateData.positions = [ballotPosition.id];
  }
  if (ballotRace) {
    candidateData.races = [ballotRace.id];
  }
  if (campaign) {
    candidateData.campaign = campaign.id;
  }

  try {
    await BallotCandidate.create(candidateData);
  } catch (e) {
    console.log('error creating candidate', e);
    await sendSlackNotification(
      'Error creating candidate',
      `Error creating candidate ${row.candidate_id}`,
      'bot-dev',
    );
  }
}

async function writeDb(rows) {
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
        'bot-dev',
      );
    }
    if (existingCandidate) {
      // todo: consider updating candidate if data has changed.
      // for example if the candidate has entered a new race
      console.log('candidate already exists');
      continue;
    } else {
      console.log('adding new candidate', row.candidate_id);
      await addNewCandidate(row);
    }
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
