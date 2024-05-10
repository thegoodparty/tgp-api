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
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      const campaignWithVoters = await Campaign.findOne({
        id: campaign.id,
      }).populate('voters');
      // Fetch all records from the Person table
      const voters = campaignWithVoters.voters || [];

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
