const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

const appBase = sails.config.custom.appBase || sails.config.appBase;

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

const s3Bucket = 'goodparty-ballotpedia';

let csvFilePath = path.join(__dirname, '../../../data/candidates');

const s3 = new S3Client({
  region: 'us-west-2',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

module.exports = {
  inputs: {
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

        if (rows) {
          console.log(`rows: ${rows.length}`);
          await writeDb(rows);
        }
      }

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('error at data-processing/bp-s3');
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('data-processing/bp-s3', e);
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};

async function addNewCandidate(row) {
  let ballotElection;

  // need to fix this.
  // lets make electionDate a string
  // and fix the insert for bp-Candidate.
  try {
    ballotElection = await BallotElection.findOne({
      electionDate: row.election_date,
      state: row.state,
    });
  } catch (e) {
    console.log('error finding ballotElection', e);
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
        campaign = await sails.helpers.campaign.byUser(user.id);
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

  console.log('row.election_date', row.election_date);

  const bpData = row;
  let candidateData = {
    bpCandidateId: row.candidate_id,
    firstName: row.first_name,
    lastName: row.last_name,
    bpData,
    state: row.state,
    parsedLocation: row.district_name,
    normalizedPositionName: row.normalized_position_name,
    parties: row.party_affiliation,
    email:
      row?.campaign_email && row.campaign_email !== ''
        ? row.campaign_email
        : row?.email && row.email !== ''
        ? row.email
        : '',
    phone: row?.campaign_phone ? row.campaign_phone : '',
    electionName: row.election_name,
    electionDay: row.election_date,
    electionResult: row.candidate_status,
    positionName: row.office_name,
    level: row?.office_level ? row.office_level : '',
    tier: row.tier,
    isJudicial: row.office_branch === 'Judicial' ? true : false,
    isPrimary: row.stage === 'Primary' ? true : false,
    isRunoff: row.stage === 'General Runoff' ? true : false,
    isUnexpired:
      row.candidate_status === 'On the Ballot' ||
      row.candidate_status === 'Candidacy Declared'
        ? true
        : false,
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

      // TODO: only update bpData

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

    const listCommand = new ListObjectsV2Command(params);
    const data = await s3.send(listCommand);

    // Sort the files by LastModified date
    const sortedFiles = data.Contents.sort((a, b) => {
      return new Date(b.LastModified) - new Date(a.LastModified);
    });

    candidateFiles = [];
    for (let i = 0; i < sortedFiles.length; i++) {
      const key = sortedFiles[i]?.Key;
      if (key?.startsWith('ballotpedia_')) {
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

    const listCommand = new ListObjectsV2Command(params);
    const data = await s3.send(listCommand);

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
    if (key?.startsWith('ballotpedia_')) {
      return key;
    }
  }
  return null;
}

const getObjectStream = async (params, file) => {
  const command = new GetObjectCommand(params);
  const response = await s3.send(command);
  return promisify(pipeline)(response.Body, file);
};

function downloadFile(bucket, key, filePath) {
  const params = {
    Bucket: bucket,
    Key: key,
  };

  const file = fs.createWriteStream(filePath);
  return getObjectStream(params, file);
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
        if (
          row.party_affiliation !== 'Democratic' &&
          row.party_affiliation !== 'Republican'
        ) {
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
  await sails.helpers.slack.slackHelper({ title, body: message }, channel);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
