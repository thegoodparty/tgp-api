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
      const filename = 'presidential-race.txt';
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
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};

const mapCand = csvRow => {
  const {
    name,
    candidate,
    combinedRaised,
    dateCampaign,
    dateOutside,
    contributionName1,
    contributionName2,
    contributionName3,
    contributionName4,
    contributionName5,
    contributionValue1,
    contributionValue2,
    contributionValue3,
    contributionValue4,
    contributionValue5,
  } = csvRow;

  const candidateHref = csvRow['candidate-href'];
  const candName = candidate.split('(')[0].trim();
  const id = candidateHref.replace(
    'https://www.opensecrets.org/2020-presidential-race/candidate?id=',
    '',
  );
  const image = csvRow['image-src'];

  let party;
  try {
    party = candidate ? candidate.split('(')[1].split(')')[0] : '';
  } catch {
    party = '';
  }
  const names = [
    contributionName1,
    contributionName2,
    contributionName3,
    contributionName4,
    contributionName5,
  ];
  const values = [
    contributionValue1,
    contributionValue2,
    contributionValue3,
    contributionValue4,
    contributionValue5,
  ];
  const smallContributions = findValue(
    names,
    values,
    'Small Individual Contributions (< $200)',
  );

  const isIncumbent = name.includes('Incumbent');
  console.log(name);
  console.log(isIncumbent);

  return {
    openSecretsId: id,
    name: candName,
    party,
    image,
    combinedRaised: strNumToInt(combinedRaised),
    smallContributions: strNumToInt(smallContributions),
    campaignReportDate: dateCampaign + '',
    outsideReportDate: dateOutside + '',
    isIncumbent,
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
  // first set all candidates to inactive, we will selective turn them active after

  // await PresidentialCandidate.update({}).set({
  //   isActive: false,
  // });
  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const {
        openSecretsId,
        name,
        image,
        party,
        combinedRaised,
        smallContributions,
        campaignReportDate,
        outsideReportDate,
        isIncumbent,
      } = row;

      const candidate = await PresidentialCandidate.findOrCreate(
        { openSecretsId },
        {
          ...row,
          isActive: true,
        },
      );

      await PresidentialCandidate.updateOne({
        openSecretsId,
      }).set({
        image,
        party,
        combinedRaised,
        smallContributions,
        campaignReportDate,
        outsideReportDate,
        isIncumbent,
        isActive: true,
      });

      // console.log(
      //   'completed row ' +
      //     i +
      //     ' candidate: ' +
      //     name +
      //     ' ' +
      //     candidate.openSecretsId,
      // );
    } catch (e) {
      console.log('error in presidential seed. ' + i);
      console.log(e);
    }
  }
  console.log('seed completed');
};

const findValue = (names, values, name) => {
  if (!names || !values || names.length !== values.length) {
    return '';
  }
  for (let i = 0; i < names.length; i++) {
    if (names[i].indexOf(name) === 0) {
      return values[i];
    }
  }
  return '';
};
