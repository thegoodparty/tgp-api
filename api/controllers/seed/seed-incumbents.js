const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Seed - Incumbents',

  description: 'incumbents database seed',

  inputs: {},

  exits: {
    success: {
      description: 'incumbents seeded',
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
      fs.createReadStream(path.join(__dirname, '../../../data/incumbents.csv'))
        .pipe(csv())
        .on('data', async data => {
          results.push(mapIncumbents(data));
        })
        .on('end', async () => {
          console.log(results);
          await createEntries(results);
          return exits.success({
            seed: `seeded ${results.length} incumbents`,
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

const mapIncumbents = csvRow => {
  const { openSecretsId, reportDate, raised } = csvRow;
  const image = csvRow['image-src']

  return {
    openSecretsId,
    image,
    raised: strNumToInt(raised),
    reportDate: reportDate + '',
  };
};

const strNumToInt = strNum => {
  if (!strNum) {
    return strNum;
  }
  return parseInt(strNum.replace('$', '').replace(/,/g, ''), 10);
};

const createEntries = async rows => {
  let row;
  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const { openSecretsId, reportDate, raised, image } = row;

      await Incumbent.updateOne({ openSecretsId }).set({
        reportDate,
        raised,
        image,
      });

      // console.log('completed row ' + i);
    } catch (e) {
      console.log('error in seed. ' + i);
      console.log(e);
    }
  }
  console.log('seed completed');
};
