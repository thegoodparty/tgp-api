const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
let csvFilePath = path.join(__dirname, '../../../data/electiontype.csv');
let count = 0;
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      let rows = await loadCSV(csvFilePath);
      for (const row of rows) {
        await ElectionType.create(row);
        count++;
      }
      return exits.success({
        message: `inserted ${count} election types.`,
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

async function loadCSV(filePath) {
  let rows = [];
  let finished = false;
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push(row);
    })
    .on('end', () => {
      finished = true;
    });
  while (!finished) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return rows;
}
