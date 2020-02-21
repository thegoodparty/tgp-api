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
  const {
    id,
    name,
    state,
    chamber,
    district,
    image,
    raised,
    pacRaised,
    smallIndividual,
    reportDate,
  } = csvRow;

  return {
    openSecretsId: id,
    name,
    state: states_hash[state],
    chamber: chamber,
    district: district === 'null' || !district ? -1 : parseInt(district, 10),
    image,
    raised: strNumToInt(raised),
    pacRaised: strNumToInt(pacRaised),
    smallContributions: strNumToInt(smallIndividual),
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
      const {
        openSecretsId,
        name,
        chamber,
        state,
        district,
        image,
        raised,
        pacRaised,
        smallContributions,
        reportDate,
      } = row;

      const incumbent = await Incumbent.findOrCreate(
        { openSecretsId },
        {
          openSecretsId,
          name,
          chamber,
          state,
          district,
          image,
          raised,
          pacRaised,
          smallContributions,
          reportDate,
        },
      );

      await Incumbent.updateOne({ openSecretsId }).set({
        openSecretsId,
        name,
        chamber,
        state,
        district,
        image,
        raised,
        pacRaised,
        smallContributions,
        reportDate,
      });

      console.log(
        'completed row ' +
          i +
          ' incumbent: ' +
          incumbent.name +
          ' ' +
          incumbent.openSecretsId,
      );
    } catch (e) {
      console.log('error in seed. ' + i);
      console.log(e);
    }
  }
  console.log('seed completed');
};

const states_hash = {
  Alabama: 'AL',
  Alaska: 'AK',
  'American Samoa': 'AS',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  'District Of Columbia': 'DC',
  'Federated States Of Micronesia': 'FM',
  Florida: 'FL',
  Georgia: 'GA',
  Guam: 'GU',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  'Marshall Islands': 'MH',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Northern Mariana Islands': 'MP',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Palau: 'PW',
  Pennsylvania: 'PA',
  'Puerto Rico': 'PR',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  'Virgin Islands': 'VI',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
};
