const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Seed -Howie Total',

  description:
    'Howies total from https://www.fec.gov/data/candidate/P00012211/',

  inputs: {},

  exits: {
    success: {
      description: 'presidential race seeded',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const filename = 'Howie-FEC.txt';
      const { content } = await sails.helpers.getSitemapHelper(filename);
      if (typeof content !== 'undefined') {
        const lines = content.split('\n');
        const results = [];
        lines.forEach(line => {
          if (typeof line === 'string' && line !== '') {
            try {
              const lineObj = JSON.parse(line);
              results.push(mapCand(lineObj));
            } catch (e) {
              console.log('failed on line: ', line);
            }
          }
        });

        await createEntries(results);
        return exits.success({
          seed: `seeded ${results.length} candidates`,
        });
      } else {
        return exits.badRequest({
          message: 'Error getting candidates',
        });
      }
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error seeding presidential ', e);
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};

const mapCand = csvRow => {
  const { total } = csvRow;

  return {
    total: strNumToInt(total),
  };
};

const createEntries = async rows => {
  let row;
  // first set all candidates to inactive, we will selective turn them active after

  // await PresidentialCandidate.update({}).set({
  //   isActive: false,
  // });
  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const { total } = row;

      await PresidentialCandidate.updateOne({
        name: 'Howie Hawkins',
      }).set({
        combinedRaised: total,
      });
    } catch (e) {
      console.log('error updating Howie. ' + i);
      console.log(e);
    }
  }
  console.log('seed completed');
};

const strNumToInt = strNum => {
  if (!strNum) {
    return strNum;
  }
  return parseInt(strNum.replace('$', '').replace(/,/g, ''), 10);
};
