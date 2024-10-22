module.exports = {
  friendlyName: 'Download CSV of People',

  description: 'Download a CSV file containing all people from the database.',

  inputs: {
    type: {
      type: 'string',
      required: true,
      isIn: [
        'full',
        'doorKnocking',
        'doorknocking',
        'sms',
        'directMail',
        'directmail',
        'telemarketing',
        'digitalAds',
        'digitalads',
        'custom',
      ],
    },
    customFilters: {
      type: 'string',
    },
    countOnly: {
      type: 'boolean',
    },
    slug: {
      type: 'string', // admin only
    },
  },

  exits: {
    success: {
      description: 'The CSV was generated and sent successfully.',
    },
    serverError: {
      description: 'There was a problem on the server.',
    },
    badRequest: {
      description: 'Bad request',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let { type, countOnly, slug } = inputs;
      if (type === 'doorknocking') {
        type = 'doorKnocking';
      }
      if (type === 'directmail') {
        type = 'directMail';
      }
      if (type === 'digitalads') {
        type = 'digitalAds';
      }
      let customFilters;
      if (inputs.customFilters && inputs.customFilters !== 'undefined') {
        customFilters = JSON.parse(inputs.customFilters);
      }
      const { user } = this.req;

      // query campaign by slug if present + user is admin
      const campaign =
        slug && user.isAdmin
          ? await Campaign.findOne({ slug }).populate('pathToVictory')
          : await sails.helpers.campaign.byUser(user.id);

      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      let canDownload = await sails.helpers.campaign.canDownloadVoterFile(
        campaign.id,
      );
      if (!canDownload) {
        await sails.helpers.slack.errorLoggerHelper(
          'Voter file get error - no path to victory set.',
          {},
        );
        console.log('Path to Victory is not set.', campaign);
        return exits.badRequest({ message: 'Path to Victory is not set.' });
      }

      let resolvedType = type;
      if (type === 'custom' && customFilters) {
        const channel = customFilters.channel;
        if (channel === 'Door Knocking') {
          resolvedType = 'doorKnocking';
        } else if (channel === 'SMS Texting' || channel === 'Texting') {
          resolvedType = 'sms';
        } else if (channel === 'Direct Mail') {
          resolvedType = 'directMail';
        } else if (channel === 'Telemarketing') {
          resolvedType = 'telemarketing';
        } else if (channel === 'Facebook') {
          resolvedType = 'digitalAds';
        }
      }
      const countQuery = typeToQuery(
        resolvedType,
        campaign,
        customFilters,
        true,
      );
      let withFixColumns = false;
      let sqlResponse = await sails.helpers.voter.queryHelper(countQuery);
      let count = parseInt(sqlResponse.rows[0].count);
      if (count === 0) {
        // is it a string?.
        withFixColumns = true;
      }
      if (countOnly && count !== 0) {
        return exits.success({ count });
      }
      if (countOnly && count === 0) {
        const countQuery = typeToQuery(
          resolvedType,
          campaign,
          customFilters,
          true,
          true,
        );
        let sqlResponse = await sails.helpers.voter.queryHelper(countQuery);
        let count = parseInt(sqlResponse.rows[0].count);
        return exits.success({ count });
      }

      console.log('count', sqlResponse.rows[0].count);

      const query = typeToQuery(
        resolvedType,
        campaign,
        customFilters,
        false,
        withFixColumns,
      );
      console.log('Constructed Query:', query);
      return await sails.helpers.voter.csvStreamHelper(query, this.res);
    } catch (error) {
      console.error('Error at downloadCsv:', error);
      return exits.serverError(error);
    }
  },
};

function typeToQuery(type, campaign, customFilters, justCount, fixColumns) {
  const state = campaign.details.state;
  let whereClause = '';
  let nestedWhereClause = '';
  let l2ColumnName = campaign.pathToVictory.data.electionType;
  const l2ColumnValue = campaign.pathToVictory.data.electionLocation;

  if (l2ColumnName && l2ColumnValue) {
    // value is like "IN##CLARK##CLARK CNTY COMM DIST 1" we need just CLARK CNTY COMM DIST 1
    let cleanValue = extractLocation(l2ColumnValue, fixColumns);
    if (fixColumns) {
      console.log('before fix columns:', l2ColumnName);
      l2ColumnName = fixCityCountyColumns(l2ColumnName);
      console.log('after fix columns:', l2ColumnName);
    }
    whereClause += `("${l2ColumnName}" = '${cleanValue}' OR "${l2ColumnName}" = '${cleanValue} (EST.)') `;
  }
  let columns = `"LALVOTERID", 
  "Voters_FirstName", 
  "Voters_LastName", 
  "Parties_Description",
  "Voters_Gender",
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
    "Residence_Addresses_HouseNumber",
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
    columns += `, "Residence_Addresses_Latitude", 
    "Residence_Addresses_Longitude", 
    "Residence_Addresses_AddressLine", 
    "Residence_Addresses_ExtraAddressLine", 
    "Residence_Addresses_HouseNumber",
    "Residence_Addresses_City", 
    "Residence_Addresses_State", 
    "Residence_Addresses_Zip"`;
  }

  if (type === 'sms') {
    columns += `, "VoterTelephones_CellPhoneFormatted"`;

    whereClause += ` AND "VoterTelephones_CellPhoneFormatted" IS NOT NULL`;
  }
  if (type === 'digitalAds') {
    columns += `, "VoterTelephones_CellPhoneFormatted",
    "Residence_Addresses_AddressLine", 
    "Residence_Addresses_ExtraAddressLine", 
    "Residence_Addresses_HouseNumber",
    "Residence_Addresses_City", 
    "Residence_Addresses_State", 
    "Residence_Addresses_Zip"`;

    whereClause += ` AND "VoterTelephones_CellPhoneFormatted" IS NOT NULL`;
  }

  if (type === 'directMail') {
    columns += `, "Mailing_Addresses_AddressLine", 
    "Mailing_Addresses_ExtraAddressLine", 
    "Mailing_Addresses_City", 
    "Mailing_Addresses_State", 
    "Mailing_Addresses_Zip", 
    "Mailing_Addresses_ZipPlus4", 
    "Mailing_Families_HHCount"`;

    // unique households
    // whereClause += ` AND "Mailing_Families_FamilyID" IN (
    //   SELECT "Mailing_Families_FamilyID"
    //   FROM public."Voter${state}"
    //   GROUP BY "Mailing_Families_FamilyID"
    //   HAVING COUNT(*) = 1
    // )`;

    // measure performance after index is added

    nestedWhereClause = 'a';
    if (whereClause !== '') {
      whereClause += ' AND ';
    }

    whereClause += ` EXISTS (
      SELECT 1
      FROM public."Voter${state}" b
      WHERE a."Mailing_Families_FamilyID" = b."Mailing_Families_FamilyID"
      GROUP BY b."Mailing_Families_FamilyID"
      HAVING COUNT(*) = 1
    )`;
  }

  if (type === 'telemarketing') {
    columns += `, "VoterTelephones_LandlineFormatted",
    "Languages_Description"`;

    whereClause += ` AND "VoterTelephones_LandlineFormatted" IS NOT NULL`;
  }

  if (customFilters?.filters && customFilters.filters.length > 0) {
    /*
     custom filter format:
     {
      channel: "Door Knocking"
      filters: ['audience_superVoters', 'audience_likelyVoters', 'party_independent', 'age_18-25', 'age_25-35']
      purpose: "GOTV"
  }
    */
    whereClause += customFiltersToQuery(customFilters.filters);
  }

  if (justCount) {
    return `SELECT COUNT(*) FROM public."Voter${state}" ${nestedWhereClause} ${
      whereClause !== '' ? `WHERE ${whereClause}` : ''
    }`;
  }

  return `SELECT ${columns} FROM public."Voter${state}" ${nestedWhereClause} ${
    whereClause !== '' ? `WHERE ${whereClause}` : ''
  }`;
}

function extractLocation(input, fixColumns) {
  console.log(
    `Extracting location from: ${input} ${
      fixColumns ? '- with fixColumns' : ''
    }`,
  );
  // Remove any trailing '##' from the input string
  let extracted = input.replace(/##$/, '');

  // Split the string by '##', take the last element, and remove ' (EST.)' if present
  // if fixColumns is true, we want to use the second element
  const res = extracted
    .split('##')
    .at(fixColumns ? 1 : -1)
    .replace(' (EST.)', '');
  console.log('Extracted:', res);
  return res;
}

function fixCityCountyColumns(value) {
  // if value starts with CITY_ return CITY
  if (value.startsWith('City_')) {
    return 'City';
  }
  if (value.startsWith('County_')) {
    return 'County';
  }
  return value;
}

function customFiltersToQuery(filters) {
  const filterConditions = {
    audience: [],
    party: [],
    age: [],
    gender: [],
  };

  filters.forEach((filter) => {
    switch (filter) {
      case 'audience_superVoters':
        filterConditions.audience.push(`CASE 
                                          WHEN "Voters_VotingPerformanceEvenYearGeneral" ~ '^[0-9]+%$' 
                                          THEN CAST(REPLACE("Voters_VotingPerformanceEvenYearGeneral", '%', '') AS numeric)
                                          ELSE NULL
                                        END > 75`);
        break;
      case 'audience_likelyVoters':
        filterConditions.audience.push(`(CASE 
                                          WHEN "Voters_VotingPerformanceEvenYearGeneral" ~ '^[0-9]+%$' 
                                          THEN CAST(REPLACE("Voters_VotingPerformanceEvenYearGeneral", '%', '') AS numeric)
                                          ELSE NULL
                                        END > 50 AND 
                                        CASE 
                                          WHEN "Voters_VotingPerformanceEvenYearGeneral" ~ '^[0-9]+%$' 
                                          THEN CAST(REPLACE("Voters_VotingPerformanceEvenYearGeneral", '%', '') AS numeric)
                                          ELSE NULL
                                        END <= 75)`);
        break;
      case 'audience_unreliableVoters':
        filterConditions.audience.push(`(CASE 
                                          WHEN "Voters_VotingPerformanceEvenYearGeneral" ~ '^[0-9]+%$' 
                                          THEN CAST(REPLACE("Voters_VotingPerformanceEvenYearGeneral", '%', '') AS numeric)
                                          ELSE NULL
                                        END > 25 AND 
                                        CASE 
                                          WHEN "Voters_VotingPerformanceEvenYearGeneral" ~ '^[0-9]+%$' 
                                          THEN CAST(REPLACE("Voters_VotingPerformanceEvenYearGeneral", '%', '') AS numeric)
                                          ELSE NULL
                                        END <= 50)`);
        break;
      case 'audience_unlikelyVoters':
        filterConditions.audience.push(`(CASE 
                                              WHEN "Voters_VotingPerformanceEvenYearGeneral" ~ '^[0-9]+%$' 
                                              THEN CAST(REPLACE("Voters_VotingPerformanceEvenYearGeneral", '%', '') AS numeric)
                                              ELSE NULL
                                            END > 1 AND 
                                            CASE 
                                              WHEN "Voters_VotingPerformanceEvenYearGeneral" ~ '^[0-9]+%$' 
                                              THEN CAST(REPLACE("Voters_VotingPerformanceEvenYearGeneral", '%', '') AS numeric)
                                              ELSE NULL
                                            END <= 25)`);
        break;
      case 'audience_firstTimeVoters':
        filterConditions.audience.push(
          `"Voters_VotingPerformanceEvenYearGeneral" IN ('0%', 'Not Eligible', '')`,
        );
        break;
      case 'party_independent':
        filterConditions.party.push(
          '("Parties_Description" = \'Non-Partisan\' OR "Parties_Description" = \'Other\')',
        );
        break;
      case 'party_democrat':
        filterConditions.party.push('"Parties_Description" = \'Democratic\'');
        break;
      case 'party_republican':
        filterConditions.party.push('"Parties_Description" = \'Republican\'');
        break;
      case 'age_18-25':
        filterConditions.age.push(
          '("Voters_Age"::integer >= 18 AND "Voters_Age"::integer <= 25)',
        );
        break;
      case 'age_25-35':
        filterConditions.age.push(
          '("Voters_Age"::integer > 25 AND "Voters_Age"::integer <= 35)',
        );
        break;
      case 'age_35-50':
        filterConditions.age.push(
          '("Voters_Age"::integer > 35 AND "Voters_Age"::integer <= 50)',
        );
        break;
      case 'age_50+':
        filterConditions.age.push('"Voters_Age"::integer > 50');
        break;
      case 'gender_male':
        filterConditions.gender.push('"Voters_Gender" = \'M\'');
        break;
      case 'gender_female':
        filterConditions.gender.push('"Voters_Gender" = \'F\'');
        break;
      case 'gender_unknown':
        filterConditions.gender.push('"Voters_Gender" IS NULL');
        break;
    }
  });

  // Combine conditions for each category with OR and wrap them in parentheses
  const audienceCondition = filterConditions.audience.length
    ? `(${filterConditions.audience.join(' OR ')})`
    : null;
  const partyCondition = filterConditions.party.length
    ? `(${filterConditions.party.join(' OR ')})`
    : null;
  const ageCondition = filterConditions.age.length
    ? `(${filterConditions.age.join(' OR ')})`
    : null;
  const genderCondition = filterConditions.gender.length
    ? `(${filterConditions.gender.join(' OR ')})`
    : null;

  // Combine all categories with AND
  const finalCondition = [
    audienceCondition,
    partyCondition,
    ageCondition,
    genderCondition,
  ]
    .filter(Boolean)
    .join(' AND ');

  return finalCondition ? ` AND ${finalCondition}` : '';
}

/*
 all customFilters options ( the keys)
 const fields = [
  {
    label: 'AUDIENCE',
    options: [
      { key: 'audience_superVoters', label: 'Super Voters (75% +)' },
      { key: 'audience_likelyVoters', label: 'Likely Voters (50%-75%)' },
      {
        key: 'audience_unreliableVoters',
        label: 'Unreliable Voters (25%-50%)',
      },
      { key: 'audience_unlikelyVoters', label: 'Unlikely Voters (0%-25%)' },
      { key: 'audience_firstTimeVoters', label: 'First Time Voters' },
    ],
  },
  {
    label: 'POLITICAL PARTY',
    options: [
      { key: 'party_independent', label: 'Independent / Non-Partisan' },
      { key: 'party_democrat', label: 'Democrat' },
      { key: 'party_republican', label: 'Republican' },
    ],
  },
  {
    label: 'AGE',
    options: [
      { key: 'age_18-25', label: '18-25' },
      { key: 'age_25-35', label: '25-35' },
      { key: 'age_35-50', label: '35-50' },
      { key: 'age_50+', label: '50+' },
    ],
  },
  {
    label: 'GENDER',
    options: [
      { key: 'gender_male', label: 'Male' },
      { key: 'gender_female', label: 'Female' },
      { key: 'gender_unknown', label: 'Unknown' },
    ],
  },
];
*/
