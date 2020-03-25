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
      fs.createReadStream(path.join(__dirname, '../../../data/ballotpedia.csv'))
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
    idName,
    candidateConnection,
    contactLinks1,
    contactLinks2,
    contactLinks3,
    contactLinks4,
    contactLinks5,
    contactLinks6,
  } = csvRow;

  const image = csvRow['image-src'];
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
  };
};

const createEntries = async rows => {
  let row;
  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const { id, isIncumbent } = row;
      console.log('isIncumbent', isIncumbent)
      if (isIncumbent) {
        console.log('incumbent id', id)
        if(id ===148){
          console.log('*************')
          console.log(row)
          console.log('*************')
        }
        await Incumbent.updateOne({ id }).set({
          ...row,
        });
      } else {
        await RaceCandidate.updateOne({ id }).set({
          ...row,
        });
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
  console.log('seed completed');
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
