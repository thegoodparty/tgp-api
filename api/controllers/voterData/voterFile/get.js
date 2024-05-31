module.exports = {
  friendlyName: 'Download CSV of People',

  description: 'Download a CSV file containing all people from the database.',

  inputs: {
    type: {
      type: 'string',
      required: true,
      isIn: ['full', 'doorKnocking', 'sms', 'directMail', 'telemarketing'],
    },
  },

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
      const { type } = inputs;
      const { user } = this.req;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      const { pathToVictory } = campaign;
      if (
        !pathToVictory?.data?.electionType ||
        !pathToVictory?.data?.electionLocation
      ) {
        await sails.helpers.slack.errorLoggerHelper(
          'Voter file get error - no path to victory set.',
          {},
        );
        console.log('Path to Victory is not set.', campaign);
        return exits.badRequest({ message: 'Path to Victory is not set.' });
      }
      const query = typeToQuery(type, campaign);

      console.log('Constructed Query:', query);
      return await sails.helpers.voter.csvStreamHelper(query, this.res);
    } catch (error) {
      console.error('Error at downloadCsv:', error);
      return exits.serverError(error);
    }
  },
};

function typeToQuery(type, campaign) {
  const state = campaign.details.state;
  let whereClause = '';
  const l2ColumnName = campaign.pathToVictory.data.electionType;
  const l2ColumnValue = campaign.pathToVictory.data.electionLocation;

  if (l2ColumnName && l2ColumnValue) {
    // value is like "IN##CLARK##CLARK CNTY COMM DIST 1" we need just CLARK CNTY COMM DIST 1
    let cleanValue = l2ColumnValue.split('##').pop();
    whereClause += `"${l2ColumnName}" = '${cleanValue}' `;
  }
  let columns =
    '"LALVOTERID", "Voters_FirstName", "Voters_MiddleName", "Voters_LastName", "Voters_NameSuffix", "Parties_Description", "Voters_Age", "Residence_Addresses_AddressLine", "Residence_Addresses_ExtraAddressLine", "Residence_Addresses_City", "Residence_Addresses_State", "Residence_Addresses_Zip", "Residence_Addresses_ZipPlus4"';
  if (type === 'full') {
    columns +=
      ', "Voters_VotingPerformanceEvenYearGeneral", "Voters_VotingPerformanceEvenYearPrimary", "Residence_Addresses_ApartmentType", "EthnicGroups_EthnicGroup1Desc", "Languages_Description", "Residence_Addresses_Latitude", "Residence_Addresses_Longitude", "Residence_HHParties_Description", "Mailing_Families_HHCount", "Voters_SequenceOddEven" ';
  }

  if (type === 'doorKnocking') {
    columns +=
      ', "Voters_VotingPerformanceEvenYearGeneral", "Voters_VotingPerformanceEvenYearPrimary", "Residence_Addresses_ApartmentType", "EthnicGroups_EthnicGroup1Desc", "Languages_Description", "Residence_Addresses_Latitude", "Residence_Addresses_Longitude", "Residence_HHParties_Description", "Mailing_Families_HHCount", "Voters_SequenceOddEven" ';
  }

  return `SELECT ${columns} FROM public."Voter${state}" WHERE ${whereClause} limit 100`;
}
