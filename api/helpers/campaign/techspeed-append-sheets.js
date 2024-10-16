const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { google } = require('googleapis');
const googleServiceEmail =
  'good-party-service@thegoodparty-1562658240463.iam.gserviceaccount.com';

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

const s3 = new S3Client({
  region: 'us-west-2',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const s3Bucket = 'goodparty-keys';

module.exports = {
  inputs: {
    campaignId: {
      type: 'number',
      required: true,
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
    const { campaignId } = inputs;
    try {
      console.log('starting techspeed-append-sheets');
      const jwtClient = await authenticateGoogleServiceAccount();
      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });
      const spreadsheetId = '15xJzodkSvYWNTvdfqwjNJeE7H3VF0kVZiwwfgrD6q2Y';
      const candidate = await getCandidate(campaignId);
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'GoodParty Candidates',
        valueInputOption: 'RAW',
        resource: {
          values: [[...candidate]],
        },
      });

      return exits.success({
        appendResponse,
      });
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error adding candidate to google sheets',
        e,
      );
      console.log('error adding candidate to google sheets : ', e);
      return exits.success(undefined);
    }
  },
};

async function getCandidate(campaignId) {
  const campaign = await Campaign.findOne({
    id: campaignId,
  });
  const user = await User.findOne({
    id: campaign.user,
  });

  const { details, data, slug } = campaign;

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';

  let office = '';
  if (details?.office && details.office !== '') {
    office = details.office;
  }
  if (details?.otherOffice && details.otherOffice !== '') {
    office = details?.otherOffice || '';
  }
  let raceId = '';
  if (details?.raceId && details.raceId !== '') {
    raceId = details.raceId;
  }
  const city = details?.city || '';
  const county = details?.county || '';
  const party = details?.party || '';
  const state = details?.state || '';
  const phone = details?.phone || '';
  const level = details?.ballotLevel || '';

  let website = '';
  if (details?.campaignWebsite && details.campaignWebsite !== '') {
    website = details.campaignWebsite;
  }
  if (data?.profile?.campaignWebsite && data.profile.campaignWebsite !== '') {
    website = data.profile.campaignWebsite;
  }

  const electionDate = details?.electionDate || '';

  // Get data from hubspot
  let incumbent = data?.hubSpotUpdates?.incumbent || '';
  let opponents = data?.hubSpotUpdates?.opponents || '';

  // Get data from pathtovictory.viability
  const pathToVictoryId = campaign?.pathToVictory;
  if (pathToVictoryId) {
    const pathToVictory = await PathToVictory.findOne({
      id: pathToVictoryId,
    });
    if (pathToVictory) {
      const viability = pathToVictory?.data?.viability || {};
      if (viability) {
        let { isIncumbent, candidates } = viability;
        if (
          (!incumbent || incumbent === '') &&
          isIncumbent &&
          isIncumbent === true
        ) {
          incumbent = 'Yes';
        }
        if ((!opponents || opponents === '') && candidates && candidates > 0) {
          opponents = candidates - 1;
        }
      }
    }
  }

  return [
    campaignId,
    raceId,
    slug,
    firstName,
    lastName,
    office,
    level,
    city,
    county,
    party,
    state,
    phone,
    website,
    electionDate,
    incumbent,
    opponents,
  ];
}

async function authenticateGoogleServiceAccount() {
  try {
    // Fetch the service account JSON from S3
    const googleServiceJSON = await readJsonFromS3(
      s3Bucket,
      'google-service-key.json',
    );

    // Log the keys to check if 'private_key' exists
    const parsed = JSON.parse(googleServiceJSON);

    // Extract the private key from the service account JSON
    const googleServiceKey = parsed.private_key;
    if (!googleServiceKey) {
      throw new Error('No private key found in the service account JSON.');
    }

    // Configure a JWT client with the service account credentials
    const jwtClient = new google.auth.JWT(
      googleServiceEmail, // Client email from the JSON
      null, // No keyFile, as we are providing the key directly
      googleServiceKey, // The private key from the JSON
      ['https://www.googleapis.com/auth/spreadsheets'], // Scopes
    );

    return jwtClient;
  } catch (error) {
    console.error('Error authenticating Google Service Account:', error);
    throw error;
  }
}

async function readJsonFromS3(bucketName, keyName) {
  try {
    const params = {
      Bucket: bucketName,
      Key: keyName,
    };

    const getCommand = new GetObjectCommand(params);
    const data = await s3.send(getCommand);
    const jsonContent = await streamToString(data.Body);
    return jsonContent;
  } catch (error) {
    console.log('Error reading JSON from S3:', error);
    throw error;
  }
}

async function streamToString(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
