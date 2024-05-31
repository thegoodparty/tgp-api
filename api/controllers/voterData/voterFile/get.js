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
  let columns = `"LALVOTERID", 
  "Voters_FirstName", 
  "Voters_MiddleName", 
  "Voters_LastName", 
  "Voters_NameSuffix", 
  "Parties_Description", 
  "Voters_Age"`;

  if (type === 'full') {
    columns += `, "Voters_VotingPerformanceEvenYearGeneral", 
    "Voters_VotingPerformanceEvenYearPrimary", 
    "Voters_VotingPerformanceEvenYearGeneralAndPrimary",
    "Residence_Addresses_ApartmentType", 
    "EthnicGroups_EthnicGroup1Desc", 
    "Residence_Addresses_Latitude", 
    "Residence_Addresses_Longitude", 
    "Residence_HHParties_Description", 
    "Mailing_Families_HHCount", 
    "Voters_SequenceOddEven",
    "VoterTelephones_CellPhoneFormatted", 
    "VoterTelephones_CellConfidenceCode",
    "VoterParties_Change_Changed_Party",
    "Languages_Description",
    "Residence_Addresses_AddressLine", 
    "Residence_Addresses_ExtraAddressLine", 
    "Residence_Addresses_City", 
    "Residence_Addresses_State", 
    "Residence_Addresses_Zip", 
    "Residence_Addresses_ZipPlus4",
    "Mailing_Addresses_AddressLine", 
    "Mailing_Addresses_ExtraAddressLine", 
    "Mailing_Addresses_City", 
    "Mailing_Addresses_State", 
    "Mailing_Addresses_Zip", 
    "Mailing_Addresses_ZipPlus4", 
    "Mailing_Addresses_DPBC", 
    "Mailing_Addresses_CheckDigit", 
    "Mailing_Addresses_HouseNumber", 
    "Mailing_Addresses_PrefixDirection", 
    "Mailing_Addresses_StreetName", 
    "Mailing_Addresses_Designator", 
    "Mailing_Addresses_SuffixDirection", 
    "Mailing_Addresses_ApartmentNum", 
    "Mailing_Addresses_ApartmentType", 
    "MaritalStatus_Description", 
    "Mailing_Families_FamilyID",
    "Mailing_Families_HHCount",
    "Mailing_HHParties_Description",
    "MilitaryStatus_Description",
    "General_2022",
    "General_2020",
    "General_2018",
    "General_2016",
    "Primary_2022",
    "Primary_2020",
    "Primary_2018",
    "Primary_2016"`;
  }

  if (type === 'doorKnocking') {
    columns += `, "Voters_VotingPerformanceEvenYearGeneral", 
    "Voters_VotingPerformanceEvenYearPrimary", 
    "Voters_VotingPerformanceEvenYearGeneralAndPrimary",
    "Residence_Addresses_ApartmentType", 
    "EthnicGroups_EthnicGroup1Desc", 
    "Languages_Description", 
    "Residence_Addresses_Latitude", 
    "Residence_Addresses_Longitude", 
    "Residence_HHParties_Description", 
    "Mailing_Families_HHCount", 
    "Voters_SequenceOddEven",
    "Residence_Addresses_AddressLine", 
    "Residence_Addresses_ExtraAddressLine", 
    "Residence_Addresses_City", 
    "Residence_Addresses_State", 
    "Residence_Addresses_Zip", 
    "Residence_Addresses_ZipPlus4"`;
  }

  if (type === 'sms') {
    columns += `, "VoterTelephones_CellPhoneFormatted", 
    "VoterTelephones_CellConfidenceCode", 
    "Voters_VotingPerformanceEvenYearGeneral",
    "Voters_VotingPerformanceEvenYearPrimary",
    "Voters_VotingPerformanceEvenYearGeneralAndPrimary",
    "VoterParties_Change_Changed_Party",
    "Residence_Addresses_AddressLine", 
    "Residence_Addresses_ExtraAddressLine", 
    "Residence_Addresses_City", 
    "Residence_Addresses_State", 
    "Residence_Addresses_Zip", 
    "Residence_Addresses_ZipPlus4"`;

    whereClause += ` AND "VoterTelephones_CellPhoneFormatted" IS NOT NULL`;
  }

  if (type === 'directMail') {
    columns += `, "Mailing_Addresses_AddressLine", 
    "Mailing_Addresses_ExtraAddressLine", 
    "Mailing_Addresses_City", 
    "Mailing_Addresses_State", 
    "Mailing_Addresses_Zip", 
    "Mailing_Addresses_ZipPlus4", 
    "Mailing_Addresses_DPBC", 
    "Mailing_Addresses_CheckDigit", 
    "Mailing_Addresses_HouseNumber", 
    "Mailing_Addresses_PrefixDirection", 
    "Mailing_Addresses_StreetName", 
    "Mailing_Addresses_Designator", 
    "Mailing_Addresses_SuffixDirection", 
    "Mailing_Addresses_ApartmentNum", 
    "Mailing_Addresses_ApartmentType", 
    "MaritalStatus_Description", 
    "Mailing_Families_FamilyID",
    "Mailing_Families_HHCount",
    "Mailing_HHParties_Description"
    `;

    // unique households
    whereClause += ` AND "Mailing_Families_FamilyID" IN (
      SELECT "Mailing_Families_FamilyID"
      FROM public."Voter${state}"
      GROUP BY "Mailing_Families_FamilyID"
      HAVING COUNT(*) = 1
    )`;

    // measure performance after index is added

    // whereClause += ` AND EXISTS (
    //   SELECT 1
    //   FROM public."Voter${state}" b
    //   WHERE a."Mailing_Families_FamilyID" = b."Mailing_Families_FamilyID"
    //   GROUP BY b."Mailing_Families_FamilyID"
    //   HAVING COUNT(*) = 1
    // );`;
  }

  if (type === 'telemarketing') {
    columns += `, "VoterTelephones_CellPhoneFormatted", 
    "VoterTelephones_CellConfidenceCode", 
    "VoterTelephones_LandlineFormatted",
    "VoterTelephones_LandlineConfidenceCode",
    "Voters_VotingPerformanceEvenYearGeneral",
    "Voters_VotingPerformanceEvenYearPrimary",
    "Voters_VotingPerformanceEvenYearGeneralAndPrimary",
    "VoterParties_Change_Changed_Party",
    "Residence_Addresses_AddressLine", 
    "Residence_Addresses_ExtraAddressLine", 
    "Residence_Addresses_City", 
    "Residence_Addresses_State", 
    "Residence_Addresses_Zip", 
    "Residence_Addresses_ZipPlus4"`;

    whereClause += ` AND "VoterTelephones_LandlineFormatted" IS NOT NULL`;
  }

  return `SELECT ${columns} FROM public."Voter${state}" WHERE ${whereClause} limit 100`;
}
