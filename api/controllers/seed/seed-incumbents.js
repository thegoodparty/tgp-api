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

const mapIncumbents = csvRow => {
  const {
    id,
    name,
    state,
    Chamber,
    district,
    image,
    raised,
    pacRaised,
    SmallIndividual,
  } = csvRow;

  return {
    openSecretsId: id,
    name,
    state,
    chamber: Chamber,
    district: district==='null' || !district ? -1 : parseInt(district, 10),
    image,
    raised: parseInt(raised, 10),
    pacRaised: parseInt(pacRaised, 10),
    smallContributions: parseInt(SmallIndividual, 10),
  };
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
        district,
        image,
        raised,
        pacRaised,
        smallContributions,
      } = row;

      const incumbent = await Incumbent.findOrCreate(
        { openSecretsId },
        {
          openSecretsId,
          name,
          chamber,
          district,
          image,
          raised,
          pacRaised,
          smallContributions,
        },
      );

      await Incumbent.updateOne({ openSecretsId }).set({
        openSecretsId,
        name,
        chamber,
        district,
        image,
        raised,
        pacRaised,
        smallContributions,
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
