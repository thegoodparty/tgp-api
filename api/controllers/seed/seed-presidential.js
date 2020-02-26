const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Seed - Presidential',

  description: 'presidential race database seed',

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
      const results = [];
      // load district csv and convert it to an array.
      fs.createReadStream(
        path.join(__dirname, '../../../data/presidential-race.csv'),
      )
        .pipe(csv())
        .on('data', async data => {
          results.push(mapCand(data));
        })
        .on('end', async () => {
          console.log(results);
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
  const {
    id,
    name,
    candidate,
    combinedRaised,
    largeContributions,
    smallIndividual,
    selfFinancing,
    federalFunds,
    other,
    dateCampaign,
    dateOutside,
    image,
    isIncumbent,
  } = csvRow;

  let party;
  try {
    party = candidate ? candidate.split('(')[1].split(')')[0] : '';
  } catch {
    party = '';
  }

  return {
    openSecretsId: id,
    name,
    party,
    image,
    combinedRaised: strNumToInt(combinedRaised),
    largeContributions: strNumToInt(largeContributions),
    smallContributions: strNumToInt(smallIndividual),
    selfFinancing: strNumToInt(selfFinancing),
    federalFunds: strNumToInt(federalFunds),
    otherFunds: strNumToInt(other),
    campaignReportDate: dateCampaign + '',
    outsideReportDate: dateOutside + '',
    isIncumbent: isIncumbent === 'yes' ? true : false,
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
      const {
        openSecretsId,
        name,
        image,
        party,
        combinedRaised,
        largeContributions,
        smallContributions,
        selfFinancing,
        federalFunds,
        otherFunds,
        campaignReportDate,
        outsideReportDate,
        isIncumbent
      } = row;
      const candidate = await PresidentialCandidate.findOrCreate(
        { openSecretsId },
        {
          ...row,
        },
      );

      await PresidentialCandidate.updateOne({ openSecretsId }).set({
        image,
        party,
        combinedRaised,
        largeContributions,
        smallContributions,
        selfFinancing,
        federalFunds,
        otherFunds,
        campaignReportDate,
        outsideReportDate,
        isIncumbent
      });

      console.log(
        'completed row ' +
          i +
          ' candidate: ' +
          name +
          ' ' +
          candidate.openSecretsId,
      );
    } catch (e) {
      console.log('error in presidential seed. ' + i);
      console.log(e);
    }
  }
  console.log('seed completed');
};
