const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

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
      const results = [];
      // load district csv and convert it to an array.
      fs.createReadStream(
        path.join(__dirname, '../../../data/races-candidates.csv'),
      )
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
  const {
    name,
    raised,
    smallIndividual,
    link,
    largeContributions,
    pac,
    selfFinancing,
    other,
  } = csvRow;

  const stateDistrict = link
    .replace('https://www.opensecrets.org/races/candidates?cycle=2020&id=', '')
    .replace('&spec=N', '');
  //the stateDistrict can be two letters of state two digits like CA03 for a house race, or CAS1 for senate race
  let chamber;
  let state;
  let district;
  if (stateDistrict.charAt(2) === 'S') {
    chamber = 'Senate';
    state = stateDistrict.substring(0, 2);
    district = parseInt(stateDistrict.substring(3, 4), 10);
  } else {
    chamber = 'House';
    state = stateDistrict.substring(0, 2);
    district = parseInt(stateDistrict.substring(2, 4), 10);
  }

  const nameArr = name.split(' (');
  const cleanName = nameArr[0];
  const party = nameArr[1].replace(')', '');
  const uuid = cleanName + stateDistrict;

  return {
    uuid,
    name: cleanName,
    state,
    district,
    party,
    chamber,
    raised: strNumToInt(raised),
    largeContributions: strNumToInt(largeContributions),
    smallContributions: strNumToInt(smallIndividual),
    pac: strNumToInt(pac),
    selfFinancing: strNumToInt(selfFinancing),
    other: strNumToInt(other),
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
        uuid,
        name,
        state,
        district,
        party,
        chamber,
        raised,
        largeContributions,
        smallContributions,
        pac,
        selfFinancing,
        other,
      } = row;
      // console.log(state, district);

      const candidate = await RaceCandidate.findOrCreate(
        { uuid },
        {
          uuid,
          name,
          state,
          district,
          party,
          chamber,
          raised,
          largeContributions,
          smallContributions,
          pac,
          selfFinancing,
          other,
        },
      );

      await RaceCandidate.updateOne({ id: candidate.id }).set({
        uuid,
        name,
        state,
        district,
        chamber,
        raised,
        largeContributions,
        smallContributions,
        pac,
        selfFinancing,
        other,
      });

      console.log('completed row ' + i + ' candidate: ' + candidate.name);
    } catch (e) {
      console.log('error in seed. ' + i);
      console.log('---');
      console.log(row);
      console.log('---');
      // console.log(e);
    }
  }
  console.log('seed completed');
};
