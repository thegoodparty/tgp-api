const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Seed Likely Voters',

  description: 'database seed',

  exits: {
    success: {
      description: 'Seed Successful',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const results = [];
      // load district csv and convert it to an array.
      fs.createReadStream(
        path.join(__dirname, '../../../data/likely-voters-senate.csv'),
      )
        .pipe(csv())
        .on('data', async data => {
          results.push(mapState(data));
        })
        .on('end', async () => {
          console.log(results);
          await createEntries(results);
          return exits.success({
            seed: 'ok',
          });
        });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error setting likely voters',
      });
    }
  },
};

const mapState = csvRow => {
  const { state, min2nd } = csvRow;
  const likelyVoters = parseInt(min2nd, 10);
  const lowercaseState = state.toLowerCase();

  return {
    lowercaseState,
    likelyVoters,
  };
};

const createEntries = async rows => {
  let row;
  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const { lowercaseState, likelyVoters } = row;
      await RaceCandidate.update({
        state: lowercaseState,
        chamber: 'Senate',
      }).set({
        likelyVoters,
      });

      await Incumbent.update({
        state: lowercaseState,
        chamber: 'Senate',
      }).set({
        likelyVoters,
      });

      console.log('completed row ' + i + ' state: ' + lowercaseState);
    } catch (e) {
      console.log('error in seed. ' + i);
      console.log(e);
    }
  }
  console.log('seed completed');
};
