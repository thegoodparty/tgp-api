const { google } = require('googleapis');
const { readJsonFromS3 } = require('../aws/readJsonFromS3')

const googleServiceEmail =
  'good-party-service@thegoodparty-1562658240463.iam.gserviceaccount.com';

const s3Bucket = 'goodparty-keys';

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

module.exports = { authenticateGoogleServiceAccount }