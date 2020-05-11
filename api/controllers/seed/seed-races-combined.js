const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Seed - Races',

  description: 'races database seed',

  inputs: {},

  exits: {
    success: {
      description: 'races seeded',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const filename = 'races-combined.txt';
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
    state,
    name,
    raised,
    district,
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

  const districtHref = csvRow['district-href'];
  const incumbentLinkHref = csvRow['incumbentLink-href'];
  const candName = name.split('(')[0].trim();
  let id;
  if (incumbentLinkHref) {
    id = incumbentLinkHref.replace(
      'https://www.opensecrets.org/members-of-congress/summary?cid=',
      '',
    );
  }
  const stateDistrict = districtHref.replace(
    'https://www.opensecrets.org/races/summary?cycle=2020&id=',
    '',
  );

  let party;
  try {
    party = name ? name.split('(')[1].split(')')[0] : '';
  } catch {
    party = '';
  }
  const chamber = district === 'Senate' ? 'Senate' : 'House';

  let districtNumber;
  if (chamber === 'Senate') {
    districtNumber = parseInt(stateDistrict.substring(3, 4), 10);
  } else {
    districtNumber = parseInt(stateDistrict.substring(2, 4), 10);
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
    'Small Individual Contributions',
  );

  const uuid = `${candName}_${stateDistrict.toLowerCase()}`;

  return {
    openSecretsId: id,
    uuid,
    name: candName,
    state: state.toLowerCase(),
    district: districtNumber,
    party,
    chamber,
    raised: strNumToInt(raised),
    smallContributions: strNumToInt(smallContributions),
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

  await RaceCandidate.update({}).set({
    isActive: false,
  });

  await Incumbent.update({}).set({
    isActive: false,
  });

  // delete all incumbent to scrape first
  await IncumbentToScrape.destroy({});

  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const {
        openSecretsId,
        uuid,
        name,
        state,
        district,
        party,
        chamber,
        raised,
        smallContributions,
      } = row;

      if (openSecretsId) {
        // incumbent - save for later scraping.
        await IncumbentToScrape.create({ openSecretsId });
        await Incumbent.findOrCreate(
          { openSecretsId },
          {
            openSecretsId,
            name,
            state,
            district,
            party,
            chamber,
            smallContributions,
            isActive: true,
          },
        );

        await Incumbent.updateOne({ openSecretsId }).set({
          openSecretsId,
          name,
          state,
          district,
          party,
          chamber,
          smallContributions,
          isActive: true,
        });
      } else {
        const candidate = await RaceCandidate.findOrCreate(
          { uuid },
          {
            ...row,
            isActive: true,
          },
        );

        await RaceCandidate.updateOne({
          uuid,
        }).set({
          ...row,
          isActive: true,
        });

        console.log(
          'completed row ' + i + ' candidate: ' + name + ' ' + candidate.uuid,
        );
      }
    } catch (e) {
      console.log('error in races combined seed. ' + i);
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
