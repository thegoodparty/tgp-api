const AWS = require('aws-sdk');
const csvParser = require('csv-parser');
const async = require('async');
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

const s3Bucket = 'goodparty-ballotpedia';

const s3 = new AWS.S3();

let maxRows;
// let maxRows = 25; // good for local dev.
let count = 0;

const profiling = {
  existing: 0,
  multipleResults: 0,
  noResults: 0,
};

module.exports = {
  inputs: {},

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
      console.log('files', files);
      const objectKey = findLatestCandidatesFile(files);
      console.log('objectKey', objectKey);

      await sails.helpers.slack.errorLoggerHelper(
        'data-processing/starting ballotpedia candidate enhance',
        {
          objectKey,
        },
      );
      await processCsvFromS3(s3Bucket, objectKey, processRow);
      await sails.helpers.slack.errorLoggerHelper(
        'data-processing/ finished ballotpedia candidate enhance',
        profiling,
      );
      console.log('profiling', profiling);
      return exits.success({ message: 'ok', profiling });
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

    // Create an async queue to process rows one at a time
    const q = async.queue(async (row, callback) => {
      try {
        await processRowCallback(row);
        if (callback) {
          return callback();
        }
      } catch (err) {
        if (callback) {
          return callback(err);
        }
      }
    }, 1); // concurrency set to 1

    q.drain(() => {
      console.log('All rows have been processed.');
      resolve();
    });

    q.error((err) => {
      console.error('Error in processing queue:', err);
      reject(err);
    });

    s3Stream
      .pipe(csvParser())
      .on('data', (row) => {
        q.push(row, (err) => {
          if (err) {
            console.error('Error processing row:', err);
          }
        });
      })
      .on('end', () => {
        console.log('CSV file successfully streamed.');
      })
      .on('error', (error) => {
        console.error('Error while streaming CSV file:', error);
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
  try {
    if (maxRows) {
      count++;
      if (count > maxRows) {
        return;
      }
    }

    // console.log('row.', row);
    // save all the fields to BallotCandidate Model and the entire row as brData

    const { first_name, last_name, state, candidate_id } = row;

    const candidateCount = await BallotCandidate.count({
      firstName: first_name,
      lastName: last_name,
      state,
      bpCandidateId: { '!=': '' },
    });

    console.log('candidateCount', candidateCount);

    if (candidateCount > 1) {
      profiling.multipleResults++;
      await sails.helpers.slack.errorLoggerHelper(
        'bp-candidates multiple results',
        { candidate_id, first_name, last_name, state },
      );
      return;
    }

    if (candidateCount === 1) {
      profiling.existing++;
      await BallotCandidate.updateOne({
        firstName: first_name,
        lastName: last_name,
        state,
        bpCandidateId: { '!=': '' },
      }).set({
        bpCandidateId: candidate_id,
        bpData: row,
      });
      return;
    }

    if (candidateCount === 0) {
      const {
        office_name,
        campaign_email,
        other_email,
        campaign_phone,
        party_affiliation,
        election_date,
        district_type,
      } = row;
      profiling.noResults++;
      const slug = slugify(`${first_name}-${last_name}-${office_name}`, {
        lower: true,
      });
      await BallotCandidate.create({
        slug,
        firstName: first_name,
        lastName: last_name,
        state,
        bpCandidateId: candidate_id,
        email: campaign_email || other_email || '',
        phone: campaign_phone || '',
        party: party_affiliation || '',
        electionDay: election_date,
        level: district_type,
        bpData: row,
      });
      return;
    }
  } catch (e) {
    console.log('error at data-processing/ballot-s3 processRow');
    console.log(e);
    await sails.helpers.slack.errorLoggerHelper(
      'data-processing/ballot-s3 processRow',
      e,
    );
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
    if (key?.startsWith('ballotpedia_results')) {
      return key;
    }
  }
  return null;
}

// bp row
/*
election_year	state	office_id	office_name	office_level	office_branch	district_id	district_ocdid	district_name	district_type	parent_district_id	parent_district_name	race_id	race_type	seats_up_for_election	race_url	election_date_id	election_date	election_date_district_type	stage_id	stage	stage_party	is_partisan_primary	stage_is_canceled	stage_is_ranked_choice	stage_write_in_other_votes	candidate_id	person_id	name	first_name	last_name	ballotpedia_url	gender	party_affiliation	is_incumbent	candidate_status	is_write_in	is_withdrawn_still_on_ballot	votes_for	votes_against	delegates_pledged	ranked_choice_voting_round	campaign_email	other_email	campaign_website	personal_website	campaign_phone		
*/
