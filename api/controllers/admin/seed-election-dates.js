const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Seed Election Dates',

  description: 'database seed - states elections date',

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
        path.join(__dirname, '../../../data/elections-dates-2020.csv'),
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
        message: 'Error getting candidates',
      });
    }
  },
};

const mapState = csvRow => {
  const { shortState, state, primary } = csvRow;

  return {
    shortName: shortState,
    name: state,
    primaryElectionDate: primary,
  };
};

const createEntries = async rows => {
  let row;
  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const { shortName, name, primaryElectionDate } = row;

      const state = await State.findOrCreate(
        { shortName },
        {
          name,
          shortName,
          primaryElectionDate,
        },
      );

      // need to update in case the state already exists
      await State.updateOne({ id: state.id }).set({
        name,
        shortName,
        primaryElectionDate,
      });

      console.log('completed row ' + i + ' state: ' + name);
    } catch (e) {
      console.log('error in seed. ' + i);
      console.log(e);
    }
  }
  console.log('seed completed');
};
