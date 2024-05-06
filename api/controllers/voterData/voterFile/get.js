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
    try {
      const { user } = this.req;
      const campaign = await sails.helpers.campaign.byUser(user);
      // Fetch all records from the Person table
      const voters = await Voter.find().populate('campaigns', {
        where: { id: campaign.id },
      });

      // Convert the records to CSV format
      let csvContent = '';
      csvContent +=
        'FirstName,LastName,NameSuffix,LandlineFormatted,CellPhoneFormatted,AddressLine,ExtraAddressLine,City,State,Zip,Age,Parties_Description,lat,lng\n'; // CSV header

      voters.forEach((voter) => {
        const {
          Voters_FirstName,
          Voters_LastName,
          Voters_NameSuffix,
          VoterTelephones_LandlineFormatted,
          VoterTelephones_CellPhoneFormatted,
          Residence_Addresses_AddressLine,
          Residence_Addresses_ExtraAddressLine,
          Residence_Addresses_City,
          Residence_Addresses_State,
          Residence_Addresses_Zip,
          Voters_Age,
          Parties_Description,
        } = voter.data || {};
        const { lat, lng } = voter;
        csvContent += `${Voters_FirstName},${Voters_LastName},${Voters_NameSuffix},${VoterTelephones_LandlineFormatted},${VoterTelephones_CellPhoneFormatted},${Residence_Addresses_AddressLine},${Residence_Addresses_ExtraAddressLine},${Residence_Addresses_City},${Residence_Addresses_State},${Residence_Addresses_Zip},${Voters_Age},${Parties_Description},${lat},${lng}\n`;
      });

      // Set the headers to instruct the browser to download the file
      this.res.set('Content-Disposition', 'attachment; filename="people.csv"');
      this.res.set('Content-Type', 'text/csv');

      return exits.success(csvContent);
    } catch (error) {
      console.log('error at downloadCsv', error);
      return exits.serverError(err);
    }
  },
};

const a = {
  LALVOTERID: 'LALCA2103',
  Voters_Active: 'Active',
  Voters_StateVoterID: '14712181',
  Voters_CountyVoterID: '111909105',
  Voters_FirstName: 'Elizabeth',
  Voters_MiddleName: 'Ann',
  Voters_LastName: 'Davis',
  Voters_NameSuffix: '',
  VoterTelephones_LandlineFormatted: '',
  VoterTelephones_LandlineConfidenceCode: '',
  VoterTelephones_CellPhoneFormatted: '',
  VoterTelephones_CellConfidenceCode: '',
  Residence_Addresses_AddressLine: '241 Bayport Way',
  Residence_Addresses_ExtraAddressLine: '',
  Residence_Addresses_City: 'Oak Park',
  Residence_Addresses_State: 'CA',
  Residence_Addresses_Zip: '91377',
  Residence_Addresses_ZipPlus4: '5536',
  Voters_SequenceZigZag: '73163919',
  Voters_SequenceOddEven: '73163939',
  Residence_Families_FamilyID: 'R075441067',
  Mailing_Addresses_AddressLine: '241 Bayport Way',
  Mailing_Addresses_ExtraAddressLine: '',
  Mailing_Addresses_City: 'Oak Park',
  Mailing_Addresses_State: 'CA',
  Mailing_Addresses_Zip: '91377',
  Mailing_Addresses_ZipPlus4: '5536',
  Mailing_Families_FamilyID: 'M075441067',
  Voters_Gender: 'F',
  Voters_Age: '63',
  Voters_BirthDate: '1961-02-19',
  DateConfidence_Description: 'Complete Date',
  Parties_Description: 'Democratic',
  AbsenteeTypes_Description: '',
  Voters_CalculatedRegDate: '1996-12-20',
  Ethnic_Description: 'English/Welsh',
  EthnicGroups_EthnicGroup1Desc: 'European',
  MaritalStatus_Description: 'Single or Unknown',
  US_Congressional_District: '26',
  State_Senate_District: '27',
  State_House_District: '042',
  County: 'VENTURA',
  Precinct: 'OAK PARK 2-009',
  County_Commissioner_District: '',
  County_Supervisorial_District: 'VENTURA CNTY SUP DIST 2',
  City: '',
  City_Council_Commissioner_District: '',
  City_Ward: '',
  Town_District: '',
  Town_Ward: '',
  Town_Council: '',
  Village: '',
  Village_Ward: '',
  Township: '',
  Township_Ward: '',
  Borough: '',
  Borough_Ward: '',
  Hamlet_Community_Area: '',
};
