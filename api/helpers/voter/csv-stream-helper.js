const pg = require('pg');
const copyTo = require('pg-copy-streams').to;
const { PassThrough, Transform } = require('stream');

const voterDatastore =
  sails.config.custom.voterDatastore || sails.config.voterDatastore;

const headerMapping = {
  LALVOTERID: 'Voter ID',
  Voters_FirstName: 'First Name',
  Voters_MiddleName: 'Middle Name',
  Voters_LastName: 'Last Name',
  Voters_NameSuffix: 'Suffix',
  Parties_Description: 'Registered Party',
  Voters_Gender: 'Gender',
  Voters_Age: 'Age',
  Voters_VotingPerformanceEvenYearGeneral: 'Likelihood to vote',
  Voters_VotingPerformanceEvenYearPrimary: 'Primary Likelihood to Vote',
  Voters_VotingPerformanceEvenYearGeneralAndPrimary:
    'Combined General and Primary Likelihood to Vote',
  Residence_Addresses_ApartmentType: 'Apartment Type',
  EthnicGroups_EthnicGroup1Desc: 'Ethnicity',
  Residence_Addresses_Latitude: 'Lattitude',
  Residence_Addresses_Longitude: 'Longitude',
  Residence_HHParties_Description: 'Household Party Registration',
  Mailing_Families_HHCount: 'Mailing Household Size',
  Voters_SequenceOddEven: 'Street Number Odd/Even',
  VoterTelephones_CellPhoneFormatted: 'Cell Phone',
  VoterTelephones_CellConfidenceCode: 'Cell Phone Confidence Code',
  VoterTelephones_LandlineFormatted: 'Landline',
  VoterTelephones_LandlineConfidenceCode: 'Landline Confidence Code',
  VoterParties_Change_Changed_Party: 'Voter Changed Party?',
  Languages_Description: 'Spoken Language',
  Residence_Addresses_AddressLine: 'Address',
  Residence_Addresses_ExtraAddressLine: 'Second Address Line',
  Residence_Addresses_HouseNumber: 'House Number',
  Residence_Addresses_City: 'City',
  Residence_Addresses_State: 'State',
  Residence_Addresses_Zip: 'Zipcode',
  Residence_Addresses_ZipPlus4: 'Zip+4',
  Mailing_Addresses_AddressLine: 'Mailing Address',
  Mailing_Addresses_ExtraAddressLine: 'Mailing Address Extra Line',
  Mailing_Addresses_City: 'Mailing City',
  Mailing_Addresses_State: 'Mailing State',
  Mailing_Addresses_Zip: 'Mailing Zip',
  Mailing_Addresses_ZipPlus4: 'Mailing Zip+4',
  Mailing_Addresses_DPBC: 'Mailing Bar Code',
  Mailing_Addresses_CheckDigit: 'Mailing Verifier',
  Mailing_Addresses_HouseNumber: 'Mailing House Number',
  Mailing_Addresses_PrefixDirection: 'Mailing Address Prefix',
  Mailing_Addresses_StreetName: 'Mailing Street Name',
  Mailing_Addresses_Designator: 'Mailng Designator',
  Mailing_Addresses_SuffixDirection: 'Mailing Suffix Direction',
  Mailing_Addresses_ApartmentNum: 'Mailing Aptartment Number',
  Mailing_Addresses_ApartmentType: 'Mailing Apartment Type',
  MaritalStatus_Description: 'Marital Status',
  Mailing_Families_FamilyID: 'Mailing Family ID',
  Mailing_HHParties_Description: 'Mailing Household Party Registration',
  MilitaryStatus_Description: 'Military Active/Veteran',
  General_2022: 'Voted in 2022',
  General_2020: 'Voted in 2020',
  General_2018: 'Voted in 2018',
  General_2016: 'Voted in 2016',
  Primary_2022: 'Voted in 2022 Primary',
  Primary_2020: 'Voter in 2020 Primary',
  Primary_2018: 'Voted in 2018 Primary',
  Primary_2016: 'Voted in 2016 Primary',
};

module.exports = {
  inputs: {
    query: {
      type: 'string',
      required: true,
    },
    res: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { query, res } = inputs;
      const client = new pg.Client({
        connectionString: voterDatastore,
      });
      await client.connect();
      let isFirstChunk = true;

      // Set the headers to instruct the browser to download the file
      res.set('Content-Disposition', 'attachment; filename="people.csv"');
      res.set('Content-Type', 'text/csv');

      // Define the mapping of old headers to new headers

      const transformHeaders = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          let data = chunk.toString();
          if (isFirstChunk) {
            isFirstChunk = false;
            // Replace headers on the first chunk
            for (const [oldHeader, newHeader] of Object.entries(
              headerMapping,
            )) {
              data = data.replace(oldHeader, newHeader);
            }
          }
          callback(null, data);
        },
      });

      const stream = client.query(
        copyTo(`COPY(${query}) TO STDOUT WITH CSV HEADER`),
      );
      const passThrough = new PassThrough();

      stream.on('error', (err) => {
        console.error('Error in stream:', err);
        (async () => {
          await sails.helpers.slack.errorLoggerHelper('Error in stream:', err);
        })();
        throw new Error(err);
      });

      stream.pipe(transformHeaders).pipe(passThrough).pipe(res);

      passThrough.on('end', async () => {
        await client.end();
        return exits.success();
      });

      passThrough.on('error', (err) => {
        console.error('Error in PassThrough stream:', err);
        (async () => {
          await sails.helpers.slack.errorLoggerHelper(
            'Error in PassThrough stream',
            err,
          );
        })();
        throw new Error(err);
      });
    } catch (err) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error in csv-stream-helper.js',
        err,
      );

      throw new Error(err);
    }
  },
};
