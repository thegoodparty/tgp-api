const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

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
      const files = await getLatestFiles(s3Bucket, 200);
      const objectKey = findLatestCandidatesFile(files);
      const localFilePath = `${csvFilePath}/${objectKey}`;
      await downloadFile(s3Bucket, objectKey, localFilePath);
      await parseFile(localFilePath);
      const sheetId = '1A1p8e3I6_cMnti1DgZPl-NqoKHyoLoR_dvslVqAqXzg';
      await sails.helpers.google.uploadSheets(
        localFilePath,
        sheetId,
        objectKey,
      );

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
              parsedUrl += `${u.website}. `;
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
      fs.writeFile(filePath, updatedCsv, (err) => {
        if (err) {
          console.error('Error writing the file', err);
        } else {
          console.log('File successfully written');
        }
      });
    });
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
