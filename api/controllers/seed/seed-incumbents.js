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
      const filename = 'incumbents.txt';
      const { content } = await sails.helpers.getSitemapHelper(filename);
      const lines = content.split('\n');
      const results = [];
      lines.forEach(line => {
        if (typeof line === 'string' && line !== '') {
          const lineObj = JSON.parse(line);
          results.push(mapCand(lineObj));
        }
      });

      await createEntries(results);
      return exits.success({
        seed: `seeded ${results.length} candidates`,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error seeding incumbents ', e);
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};

const mapCand = csvRow => {
  const { openSecretsId, reportDate, raised } = csvRow;
  const image = csvRow['image-src'];
  console.log('csvRow', csvRow)
  return {
    openSecretsId,
    image,
    raised: strNumToInt(raised),
    reportDate: reportDate + '',
  };
};

const strNumToInt = strNum => {
  if (!strNum) {
    return 0;
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
