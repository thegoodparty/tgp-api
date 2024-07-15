module.exports = {
  friendlyName: 'count voters in a voter file',

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
        'custom',
      ],
    },
    customFilters: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'ok',
    },
    serverError: {
      description: 'There was a problem on the server',
    },
    badRequest: {
      description: 'Bad request',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let { type } = inputs;
      if (type === 'doorknocking') {
        type = 'doorKnocking';
      }
      if (type === 'directmail') {
        type = 'directMail';
      }
      let customFilters;
      if (inputs.customFilters && inputs.customFilters !== 'undefined') {
        customFilters = JSON.parse(inputs.customFilters);
      }
      const { user } = this.req;
      const campaign = await sails.helpers.campaign.byUser(user);
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
      if (type === 'custom') {
        const channel = customFilters.channel;
        if (channel === 'Door Knocking') {
          resolvedType = 'doorKnocking';
        } else if (channel === 'SMS Texting') {
          resolvedType = 'sms';
        } else if (channel === 'Direct Mail') {
          resolvedType = 'directMail';
        } else if (channel === 'Telemarketing') {
          resolvedType = 'telemarketing';
        }
      }
      let query = typeToQuery(resolvedType, campaign, customFilters);

      console.log('Constructed Query:', query);
      let sqlResponse = await sails.helpers.voter.queryHelper(query);
      let count = sqlResponse?.rows[0]?.count;
      console.log('count:', count);
      if (count > 0) {
        return exits.success({ count });
      }
      console.log('count is 0, trying with fixed columns');
      query = typeToQuery(resolvedType, campaign, customFilters, true);
      console.log('Constructed Query with fixed columns:', query);
      sqlResponse = await sails.helpers.voter.queryHelper(query);
      count = sqlResponse?.rows[0]?.count;
      console.log('count2:', count);
      return exits.success({ count });
    } catch (error) {
      console.error('Error voter file count:', error);
      return exits.serverError(error);
    }
  },
};

function typeToQuery(type, campaign, customFilters, fixColumns) {
  const state = campaign.details.state;
  let whereClause = '';
  let nestedWhereClause = '';
  let l2ColumnName = campaign.pathToVictory.data.electionType;
  const l2ColumnValue = campaign.pathToVictory.data.electionLocation;

  if (l2ColumnName && l2ColumnValue) {
    // value is like "IN##CLARK##CLARK CNTY COMM DIST 1" we need just CLARK CNTY COMM DIST 1
    let cleanValue = extractLocation(l2ColumnValue);
    if (fixColumns) {
      l2ColumnName = fixCityCountyColumns(l2ColumnName);
    }
    whereClause += `"${l2ColumnName}" = '${cleanValue}' `;
  }

  if (type === 'sms') {
    whereClause += ` AND "VoterTelephones_CellPhoneFormatted" IS NOT NULL`;
  }

  if (type === 'directMail') {
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

  return `SELECT COUNT(*) FROM public."Voter${state}" ${nestedWhereClause} ${
    whereClause !== '' ? `WHERE ${whereClause}` : ''
  }`;
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

function extractLocation(input) {
  console.log('Extracting location from:', input);
  // Remove any trailing '##' from the input string
  let extracted = input.replace(/##$/, '');

  // Split the string by '##', take the last element, and remove ' (EST.)' if present
  const res = extracted.split('##').pop().replace(' (EST.)', '');
  console.log('Extracted:', res);
  return res;
}
