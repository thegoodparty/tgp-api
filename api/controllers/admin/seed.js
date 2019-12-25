const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Seed',

  description: 'database seed',

  inputs: {
    indexStart: {
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let { indexStart } = inputs;
      this.req.setTimeout(60000 * 20);
      const results = [];
      // load district csv and convert it to an array.
      fs.createReadStream(
        path.join(__dirname, '../../../data/districts-full.csv'),
      )
        .pipe(csv())
        .on('data', async data => {
          results.push(mapZip(data));
        })
        .on('end', async () => {
          console.log(results);
          await createEntries(results, indexStart);
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

const mapZip = csvRow => {
  const {
    ZIPCode,
    Sequence,
    PrimaryCity,
    PrimaryCounty,
    ApproxPct,
    State,
    District,
  } = csvRow;

  return {
    zip: ZIPCode,
    primaryCity: PrimaryCity,
    primaryCounty: PrimaryCounty,
    approxPct: parseInt(ApproxPct, 10),
    sequence: parseInt(Sequence, 10),
    shortState: State.toLowerCase(),
    longState: states[State],
    congDistrict: District,
  };
};

const createEntries = async (rows, indexStart = 0) => {
  let row;
  for (let i = indexStart; i < rows.length; i++) {
    try {
      row = rows[i];
      const {
        zip,
        primaryCity,
        primaryCounty,
        approxPct,
        sequence,
        shortState,
        longState,
        congDistrict,
      } = row;

      const state = await State.findOrCreate(
        { shortName: shortState },
        {
          name: longState,
          shortName: shortState,
        },
      );

      const cd = await CongDistrict.findOrCreate(
        {
          ocdDivisionId: `ocd-division/country:us/state:${shortState}/cd:${congDistrict}`,
        },
        {
          name: `${primaryCity}, ${shortState}-${congDistrict}`,
          code: congDistrict,
          state: state.id,
          ocdDivisionId: `ocd-division/country:us/state:${shortState}/cd:${congDistrict}`,
        },
      );

      //test end
      await CongDistrict.updateOne({
        ocdDivisionId: `ocd-division/country:us/state:${shortState}/cd:${congDistrict}`,
      }).set({
        name: `${primaryCity}, ${shortState}-${congDistrict}`,
        code: congDistrict,
        state: state.id,
        ocdDivisionId: `ocd-division/country:us/state:${shortState}/cd:${congDistrict}`,
      });

      // temp end

      let zipCode = await ZipCode.findOne({ zip });
      if (zipCode) {
        const approxPctArr = zipCode.approxPctArr;
        // for cleanup
        if (approxPctArr && typeof approxPctArr === 'string') {
          const apx = JSON.parse(approxPctArr);
          // update only if this district is not in the array.
          let isDistrictInArray = false;
          for (let i = 0; i < apx.length; i++) {
            if (apx[i].districtId === cd.id) {
              isDistrictInArray = true;
            }
          }
          if (!isDistrictInArray) {
            apx.push({ districtId: cd.id, pct: approxPct });
            await ZipCode.updateOne({ id: zipCode.id }).set({
              approxPctArr: JSON.stringify(apx),
            });
          }
        } else {
          //arr doesn't exist. create one from the number
          const newApx = [{ districtId: cd.id, pct: approxPct }];
          await ZipCode.updateOne({ id: zipCode.id }).set({
            approxPctArr: JSON.stringify(newApx),
          });
        }
      } else {
        //zip code not found, create a new one
        const newApx = [{ districtId: cd.id, pct: approxPct }];
        zipCode = await ZipCode.create({
          zip,
          primaryCity,
          primaryCounty,
          approxPct,
          approxPctArr: JSON.stringify(newApx),
          sequence,
          stateLong: longState,
          stateShort: shortState,
        }).fetch();
      }
      await ZipCode.addToCollection(zipCode.id, 'cds', cd.id);

      console.log('completed row ' + i + ' zip: ' + zip);
    } catch (e) {
      console.log('error in seed. ' + i);
      console.log(e);
    }
  }
  console.log('seed completed');
};

const states = {
  AL: 'Alabama',
  AK: 'Alaska',
  AS: 'American Samoa',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District Of Columbia',
  FM: 'Federated States Of Micronesia',
  FL: 'Florida',
  GA: 'Georgia',
  GU: 'Guam',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MH: 'Marshall Islands',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  MP: 'N. Mariana Islands',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PW: 'Palau',
  PA: 'Pennsylvania',
  PR: 'Puerto Rico',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VI: 'Virgin Islands',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};
