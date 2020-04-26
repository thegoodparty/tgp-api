const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Seed - Race Candidates',

  description: 'Candidates database seed',

  exits: {
    success: {
      description: 'candidates seeded',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const results = [];
      let filename = '../../../data/ballotpedia-manual-matching.csv';
      // load district csv and convert it to an array.
      fs.createReadStream(path.join(__dirname, filename))
        .pipe(csv())
        .on('data', async data => {
          results.push(mapCand(data));
        })
        .on('end', async () => {
          // console.log(results);
          await createEntries(results);
          return exits.success({
            seed: `seeded ${results.length} candidates`,
          });
        });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};

const mapCand = csvRow => {
  const { candidate, url } = csvRow;

  const nameArr = candidate.split('|');
  const id = nameArr[0];
  const name = nameArr[1];
  const isIncumbent = nameArr[2] === 'incumbent';

  return {
    id: parseInt(id),
    isIncumbent,
    source: url,
  };
};

const createEntries = async rows => {
  let row;
  let counter = 0;

  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const { id, isIncumbent, source } = row;
      if (!id || !source) {
        continue;
      }

      if (isIncumbent) {
        await Incumbent.updateOne({ id }).set({
          source,
        });
      } else {
        await RaceCandidate.updateOne({ id }).set({
          source,
        });
      }

      console.log('completed row ' + i + ' candidate: ' + id);
    } catch (e) {
      console.log('error in seed. ' + i);
      console.log('---');
      console.log(row);
      console.log('---');
      console.log(e);
    }
  }
  console.log('seed completed. Updated Entries: ' + counter);
};
