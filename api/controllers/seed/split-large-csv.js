const fs = require('fs');
const readline = require('readline');
const path = require('path');
const csvFilePath = path.join(
  __dirname,
  '../../../data/geoPoliticalEntities/dec23/uscities_v1.77.csv',
);

const outputPath = path.join(
  __dirname,
  '../../../data/geoPoliticalEntities/dec23/cities/',
);

let fileCount = 0;
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      splitCsvFile(csvFilePath, 5000);
      return exits.success({
        message: `saved into ${fileCount}`,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

async function splitCsvFile(filePath, linesPerFile) {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let fileCount = 0;
  let lineCount = 0;
  let outFile = null;
  let headerLine = null;

  for await (const line of rl) {
    // Capture the header line
    if (lineCount === 0) {
      headerLine = line;
      lineCount++;
      continue;
    }

    // Write the header line in each new file
    if (lineCount % linesPerFile === 1 || lineCount === 1) {
      if (outFile) {
        outFile.close();
      }
      outFile = fs.createWriteStream(
        `${outputPath}cities_part${++fileCount}.csv`,
      );
      outFile.write(headerLine + '\n');
    }

    outFile.write(line + '\n');
    lineCount++;
  }

  if (outFile) {
    outFile.close();
  }
}
