module.exports = {
  friendlyName: 'Seed - Twitter Followers',

  description: 'Twitter Followers database seed',

  inputs: {},

  exits: {
    success: {
      description: 'Twitter Followers seeded',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const filename = 'twitter-followers.txt';
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
      await sails.helpers.errorLoggerHelper('Error seeding incumbents ', e);
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};

const mapCand = (csvRow, secondPass) => {
  const { candidate, followers } = csvRow;

  if (!candidate) {
    console.log('no candidate');
    return {};
  }

  const twitter = csvRow['candidate-href'];

  const nameArr = candidate.split('|');
  const id = nameArr[0];
  const name = nameArr[1];
  const isIncumbent = nameArr[2] === 'incumbent';
  const chamber = nameArr[3];

  return {
    id: parseInt(id),
    isIncumbent,
    twitter,
    chamber,
    name,
    twitterFollowers: parseInt(followers.replace(/,/g, ''), 10),
  };
};

const createEntries = async rows => {
  let row;
  let counter = 0;

  for (let i = 0; i < rows.length; i++) {
    try {
      row = rows[i];
      const { id, isIncumbent, name, chamber, twitterFollowers } = row;
      if (twitterFollowers) {
        counter++;
        console.log('chamber', chamber)
        if (chamber === 'presidential') {
          console.log('presidential ======================', name, twitterFollowers)
          await PresidentialCandidate.updateOne({ name, isActive: true }).set({
            twitterFollowers,
          });
        } else if (isIncumbent) {
          await Incumbent.updateOne({ id, isActive: true }).set({
            twitterFollowers,
          });
        } else {
          await RaceCandidate.updateOne({ id, isActive: true }).set({
            twitterFollowers,
          });
        }

        console.log('completed row ' + i + ' candidate: ' + id);
      }
    } catch (e) {
      console.log('error in seed. ' + i);
      console.log('---');
      console.log(row);
      console.log('---');
      console.log(e);
    }
  }
  console.log('Twitter seed completed. Updated Entries: ' + counter);
};
