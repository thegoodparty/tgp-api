const AWS = require('aws-sdk');
const csvParser = require('csv-parser');
const slugify = require('slugify');

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

AWS.config.update({
  region: 'us-west-2',
  accessKeyId,
  secretAccessKey,
});

const s3Bucket = 'goodparty-ballotready';

const s3 = new AWS.S3();

let maxRows;
// let maxRows = 20; // good for local dev
let count = 0;

module.exports = {
  inputs: {
    allFiles: {
      type: 'boolean',
      defaultsTo: false,
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

      files = await getLatestFiles(s3Bucket, 200);
      const objectKey = findLatestCandidatesFile(files);
      await processCsvFromS3(s3Bucket, objectKey, processRow);
      return exits.success({ message: 'ok' });
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

async function processCsvFromS3(bucketName, objectKey, processRowCallback) {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
    };

    const s3Stream = s3.getObject(params).createReadStream();

    s3Stream
      .pipe(csvParser())
      .on('data', (row) => {
        processRowCallback(row);
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
        resolve();
      })
      .on('error', (error) => {
        console.error('Error while processing CSV file:', error);
        reject(error);
      });
  });
}

/*
Row example:
{
  id: '919151',
  candidacy_id: '919151',
  election_id: '5264',
  election_name: 'Kansas Primary Election',
  election_day: '2024-08-06',
  position_id: '294552',
  mtfcc: 'G4020',
  geo_id: '20137',
  position_name: 'Norton County Attorney',
  sub_area_name: '',
  sub_area_value: '',
  sub_area_name_secondary: '',
  sub_area_value_secondary: '',
  state: 'KS',
  level: 'county',
  tier: '3',
  is_judicial: 'false',
  is_retention: 'false',
  number_of_seats: '1',
  normalized_position_id: '975',
  normalized_position_name: 'County Attorney',
  race_id: '1614856',
  geofence_id: '1244486',
  geofence_is_not_exact: 'false',
  is_primary: 'true',
  is_runoff: 'false',
  is_unexpired: 'false',
  candidate_id: '826801',
  first_name: 'Abigail',
  middle_name: 'R.',
  nickname: '',
  last_name: 'Horn',
  suffix: '',
  phone: '',
  email: '',
  image_url: '',
  parties: '[{"name"=>"Republican", "short_name"=>"R"}]',
  urls: '[]',
  election_result: '',
  candidacy_created_at: '2024-06-12 02:44:12.929',
  candidacy_updated_at: '2024-06-12 02:44:12.929'
}
*/

async function processRow(row) {
  // save all the fields to BallotCandidate Model and the entire row as brData
  const {
    id,
    candidacy_id,
    election_id,
    position_id,
    first_name,
    middle_name,
    last_name,
    state,
    position_name,
    normalized_position_name,
    is_judicial,
    is_retention,
    is_unexpired,
    phone,
    email,
    election_day,
    level,
    tier,
    parties,
    election_result,
    race_id,
    election_name,
  } = row;

  const slug = slugify(`${first_name}-${last_name}-${position_name}`, {
    lower: true,
  });

  let party = parties;
  if (parties) {
    const match = parties.match(/"name"=>\s*"([^"]+)"/);
    if (match && match[1]) {
      party = match[1];
    }
  }
  if (party === 'Republican' || party === 'Democratic') {
    return;
  }
  if (maxRows) {
    count++;
    if (count > maxRows) {
      return;
    }
  }

  const dbCandidate = await BallotCandidate.findOrCreate(
    {
      brCandidateId: id,
    },
    {
      brCandidateId: id,
      slug,
      firstName: first_name,
    },
  );
  await BallotCandidate.updateOne({ id: dbCandidate.id }).set({
    brCandidateId: candidacy_id,
    slug,
    electionId: election_id,
    positionId: position_id,
    firstName: first_name,
    middleName: middle_name,
    lastName: last_name,
    state,
    positionName: position_name,
    electionName: election_name,
    normalizedPositionName: normalized_position_name,
    isJudicial: is_judicial === 'true',
    isRetention: is_retention === 'true',
    isUnexpired: is_unexpired === 'true',
    phone,
    email,
    electionDay: election_day,
    level,
    tier,
    party,
    electionResult: election_result,
    brData: row,
    raceId: race_id,
  });
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
