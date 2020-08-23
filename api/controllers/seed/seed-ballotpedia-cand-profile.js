const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

module.exports = {
  friendlyName: 'Seed - Race Candidates',

  description: 'Candidates database seed',

  inputs: {},

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
      const { secondPass, manualResults } = inputs;

      let filename = 'ballotpedia-cand-profile.txt';

      const { content } = await sails.helpers.getSitemapHelper(filename);
      const lines = content.split('\n');
      const results = [];

      lines.forEach(line => {
        if (typeof line === 'string' && line !== '') {
          try {
            const lineObj = JSON.parse(line);
            results.push(mapCand(lineObj, secondPass));
          } catch (e) {
            console.log('failed on line: ', line);
          }
        }
      });

      await createEntries(results, secondPass, manualResults);
      return exits.success({
        seed: `seeded candidates`,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error seeding ballotpedia', e);
      return exits.badRequest({
        message: 'Error seeding ballotpedia',
      });
    }
  },
};

const mapCand = (csvRow, secondPass) => {
  const { idName, candidateInfo, keyMessages } = csvRow;

  if (!idName) {
    console.log('no idName');
    return {};
  }

  const nameArr = idName.split('|');
  const id = nameArr[0];
  // const name = nameArr[1];
  const isIncumbent = nameArr[2] === 'incumbent';

  return {
    id: parseInt(id),
    isIncumbent,
    candidateInfo,
    keyMessages,
  };
};

const createEntries = async rows => {
  let row;
  let counter = 0;

  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const { id, isIncumbent, candidateInfo, keyMessages } = row;
      console.log('trying id', id);
      counter++;
      if (candidateInfo || keyMessages) {
        if (isIncumbent) {
          await Incumbent.updateOne({ id }).set({
            candidateInfo,
            keyMessages,
          });
        } else {
          await RaceCandidate.updateOne({ id }).set({
            candidateInfo,
            keyMessages,
          });
        }
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
  console.log('Ballotpedia seed completed. Updated Entries: ' + counter);
};
