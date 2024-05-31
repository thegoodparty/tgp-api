const pg = require('pg');
const copyTo = require('pg-copy-streams').to;
const { PassThrough } = require('stream');

module.exports = {
  friendlyName: 'Download CSV of People',

  description: 'Download a CSV file containing all people from the database.',

  inputs: {},

  exits: {
    success: {
      description: 'The CSV was generated and sent successfully.',
    },
    serverError: {
      description: 'There was a problem on the server.',
    },
  },

  fn: async function (inputs, exits) {
    const client = new pg.Client({
      connectionString: sails.config.datastores.default.url,
    });

    try {
      await client.connect();
      const { user } = this.req;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      const campaignId = campaign.id;
      const query = `
        COPY (
          SELECT
            v.data->>'Voters_FirstName' AS "FirstName",
            v.data->>'Voters_LastName' AS "LastName",
            v.data->>'Voters_NameSuffix' AS "NameSuffix",
            v.data->>'VoterTelephones_LandlineFormatted' AS "LandlineFormatted",
            v.data->>'VoterTelephones_CellPhoneFormatted' AS "CellPhoneFormatted",
            v.data->>'Residence_Addresses_AddressLine' AS "AddressLine",
            v.data->>'Residence_Addresses_ExtraAddressLine' AS "ExtraAddressLine",
            v.data->>'Residence_Addresses_City' AS "City",
            v.data->>'Residence_Addresses_State' AS "State",
            v.data->>'Residence_Addresses_Zip' AS "Zip",
            v.data->>'Voters_Age' AS "Age",
            v.data->>'Parties_Description' AS "Parties_Description",
            v.lat,
            v.lng
          FROM
            Voter v
          INNER JOIN
            public.campaign_voters__voter_campaigns cv ON cv.voter_campaigns = v.id
          WHERE
            cv.campaign_voters = '${campaignId}'
        ) TO STDOUT WITH CSV HEADER
      `;

      console.log('Constructed Query:', query);

      // Set the headers to instruct the browser to download the file
      this.res.set('Content-Disposition', 'attachment; filename="people.csv"');
      this.res.set('Content-Type', 'text/csv');

      const stream = client.query(copyTo(query));
      const passThrough = new PassThrough();

      stream.on('error', (err) => {
        console.error('Error in stream:', err);
        return exits.serverError(err);
      });

      stream.on('data', (chunk) => {
        console.log('Data chunk received:', chunk.toString());
      });

      stream.pipe(passThrough).pipe(this.res);

      passThrough.on('end', async () => {
        console.log('PassThrough stream ended');
        await client.end();
        return exits.success();
      });

      passThrough.on('error', (err) => {
        console.error('Error in PassThrough stream:', err);
        return exits.serverError(err);
      });
    } catch (error) {
      console.error('Error at downloadCsv:', error);
      await client.end();
      return exits.serverError(error);
    }
  },
};
