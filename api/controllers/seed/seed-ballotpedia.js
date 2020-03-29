const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Seed - Race Candidates',

  description: 'Candidates database seed',

  inputs: {
    secondPass: {
      type: 'boolean',
    },
  },

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
      const { secondPass } = inputs;
      const results = [];
      let filename = '../../../data/ballotpedia.csv';
      if (secondPass) {
        filename = '../../../data/ballotpedia-no-match.csv';
      }
      // load district csv and convert it to an array.
      fs.createReadStream(path.join(__dirname, filename))
        .pipe(csv())
        .on('data', async data => {
          results.push(mapCand(data, secondPass));
        })
        .on('end', async () => {
          // console.log(results);
          await createEntries(results, secondPass);
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

const mapCand = (csvRow, secondPass) => {
  const {
    idName,
    candidateConnection,
    campaignWebsite,
    contactLinks1,
    contactLinks2,
    contactLinks3,
    contactLinks4,
    contactLinks5,
    contactLinks6,
    nameState,
    district,
    state,
  } = csvRow;

  const image = csvRow['image-src'];
  const source = secondPass ? csvRow['nameState-href'] : csvRow['idName-href'];
  const contactLinksHref1 = csvRow['contactLinks1-href'];
  const contactLinksHref2 = csvRow['contactLinks2-href'];
  const contactLinksHref3 = csvRow['contactLinks3-href'];
  const contactLinksHref4 = csvRow['contactLinks4-href'];
  const contactLinksHref5 = csvRow['contactLinks5-href'];
  const contactLinksHref6 = csvRow['contactLinks6-href'];

  const socialChannels = [
    {
      name: contactLinks1,
      link: contactLinksHref1,
    },
    {
      name: contactLinks2,
      link: contactLinksHref2,
    },
    {
      name: contactLinks3,
      link: contactLinksHref3,
    },
    {
      name: contactLinks4,
      link: contactLinksHref4,
    },
    {
      name: contactLinks5,
      link: contactLinksHref5,
    },
    {
      name: contactLinks6,
      link: contactLinksHref6,
    },
  ];

  const facebook = findChannel('Facebook', socialChannels);
  const twitter = findChannel('Twitter', socialChannels);
  const website = findChannel('website', socialChannels);

  let districtNumber;
  let chamberName;
  if (district) {
    if (district.includes('House')) {
      chamberName = 'House';
      districtNumber = parseInt(district.split('District ')[1]);
    } else if (district.includes('Senate')) {
      chamberName = 'Senate';
    }
  }

  const nameArr = idName.split('|');
  const id = nameArr[0];
  const name = nameArr[1];
  const isIncumbent = nameArr[2] === 'incumbent';

  return {
    id: parseInt(id),
    isIncumbent,
    image: image || '',
    facebook: facebook || '',
    twitter: twitter || '',
    website: website || '',
    info: candidateConnection ? encodeURI(candidateConnection) : '',
    campaignWebsite: campaignWebsite ? encodeURI(campaignWebsite) : '',
    source,
    nameState,
    ballotState: state,
    chamberName,
    districtNumber,
  };
};

const createEntries = async (rows, secondPass) => {
  let row;
  let counter = 0;

  // set all to second pass and then turn off one by one.
  if (!secondPass) {
    await Incumbent.update({ isActive: true }).set({
      needsSecondPass: true,
    });
    await RaceCandidate.update({ isActive: true }).set({
      needsSecondPass: true,
    });
  }

  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const {
        id,
        isIncumbent,
        nameState,
        chamberName,
        districtNumber,
        ballotState,
      } = row;

      if (secondPass) {
        const stateplus = nameState.split('(')[1];
        if (stateplus) {
          const shortState = states_hash[ballotState];
          let candidate;
          if (isIncumbent) {
            candidate = await Incumbent.findOne({ id });
          } else {
            candidate = await RaceCandidate.findOne({ id });
          }
          if (
            candidate.chamber === 'House' &&
            candidate.district !== districtNumber
          ) {
            continue;
          }
          if (
            shortState &&
            candidate.state === shortState.toLowerCase() &&
            chamberName === candidate.chamber
          ) {
            counter++;
            if (isIncumbent) {
              await Incumbent.updateOne({ id }).set({
                ...row,
                needsSecondPass: false,
              });
            } else {
              await RaceCandidate.updateOne({ id }).set({
                ...row,
                needsSecondPass: false,
              });
            }
          }
        }
      } else {
        if (isIncumbent) {
          await Incumbent.updateOne({ id }).set({
            ...row,
            needsSecondPass: false,
          });
        } else {
          await RaceCandidate.updateOne({ id }).set({
            ...row,
            needsSecondPass: false,
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
  console.log('seed completed. Updated Entries: ' + counter);
};

const findChannel = (channelName, channels) => {
  const priorities = [
    `Personal ${channelName}`,
    `Campaign ${channelName}`,
    `Official ${channelName}`,
  ];
  const channelFound = [false, false, false];

  channels.forEach(channel => {
    if (channel.name) {
      priorities.forEach((priority, index) => {
        if (priority === channel.name) {
          channelFound[index] = channel.link;
        }
      });
    }
  });

  if (channelFound[0]) {
    return channelFound[0];
  }
  if (channelFound[1]) {
    return channelFound[1];
  }
  if (channelFound[2]) {
    return channelFound[2];
  }
  return null;
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
