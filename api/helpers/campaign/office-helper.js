const axios = require('axios');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

const getChatCompletion = require('../../utils/ai/get-chat-completion');

module.exports = {
  friendlyName: 'Office Helper',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
    officeName: {
      type: 'string',
      required: true,
    },
    electionLevel: {
      type: 'string',
      enum: [
        'federal',
        'state',
        'county',
        'city',
        'local',
        'township',
        'regional',
      ],
    },
    electionState: {
      type: 'string',
      required: true,
    },
    electionCounty: {
      type: 'string',
    },
    electionMunicipality: {
      type: 'string',
    },
    subAreaName: {
      type: 'string',
    },
    subAreaValue: {
      type: 'string',
    },
  },
  exits: {
    success: {
      description: 'OK',
    },
    badRequest: {
      description: 'Error',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const {
        slug,
        officeName,
        electionLevel,
        electionState,
        electionCounty,
        electionMunicipality,
        subAreaName,
        subAreaValue,
      } = inputs;

      if (electionLevel === 'federal') {
        if (
          officeName.includes('President of the United States') ||
          officeName.includes('Senate') ||
          officeName.includes('Governor')
        ) {
          return exits.success({
            // Handle special case where we want the entire state or country.
            electionTypes: [{ column: '', value: '' }],
            electionDistricts: {},
          });
        }
      }
      let searchColumns = [];
      let foundMiscDistricts = [];
      sails.helpers.log(slug, `Searching misc districts for ${officeName}`);
      foundMiscDistricts = await searchMiscDistricts(officeName, electionState);

      if (foundMiscDistricts.length > 0) {
        searchColumns = foundMiscDistricts;
      }
      sails.helpers.log(slug, 'searchColumns', searchColumns);

      // STEP 1: determine if there is a subAreaName / District
      let districtValue = getDistrictValue(
        officeName,
        subAreaName,
        subAreaValue,
      );

      // let formattedDistrictValue = districtValue;
      // if (districtValue && districtValue.length === 1) {
      //   formattedDistrictValue = `0${districtValue}`;
      // }

      // STEP 2: Figure out the main search column (City, County, etc.) and value
      // This also applies to the miscellaneous districts.
      let electionTypes = [];

      let searchString = getSearchString(
        officeName,
        subAreaName,
        subAreaValue,
        electionCounty,
        electionMunicipality,
        electionState,
      );
      if (searchColumns.length > 0) {
        // electionSearch = formattedDistrictValue;
        electionTypes = await getSearchColumn(
          searchColumns,
          electionState,
          searchString,
        );
      }

      // If we don't find a misc district we fall back to state/county/city.
      if (electionTypes.length === 0) {
        // if (electionLevel === 'county' && electionCounty) {
        //   electionSearch = electionCounty;
        // } else if (electionLevel === 'city' && electionMunicipality) {
        //   electionSearch = electionMunicipality;
        // } else {
        //   // Note: we may want to search for the long AND short state to maximize match.
        //   electionSearch = electionState; // await sails.helpers.zip.shortToLongState(electionState);
        //   electionSearch2 = formattedDistrictValue;
        // }
        let searchColumns = determineSearchColumns(electionLevel, officeName);
        if (searchColumns.length > 0) {
          electionTypes = await getSearchColumn(
            searchColumns,
            electionState,
            searchString,
          );
        } else {
          // when we have a state position that doesn't match house or senate
          // and doesn't match any misc district.
          // we can return all results for the state.
          electionTypes = [{ column: '', value: '' }];
        }
      }
      sails.helpers.log(slug, 'electionTypes', electionTypes);

      let electionDistricts = {};
      // STEP 3 : If its a Municipality/County then Determine any district / ward / sub area
      // This does not apply to the miscellaneous districts or federal/state.
      if (
        electionLevel !== 'federal' &&
        electionLevel !== 'state' &&
        electionTypes.length > 0 &&
        foundMiscDistricts.length === 0 &&
        districtValue
      ) {
        electionDistricts = await determineElectionDistricts(
          officeName,
          electionTypes,
          electionState,
          searchString,
          //districtValue,
        );
      }

      return exits.success({
        electionTypes,
        electionDistricts,
      });
    } catch (e) {
      console.log('error at office-helper', e);
      return exits.success('');
    }
  },
};

async function determineElectionDistricts(
  officeName,
  electionTypes,
  electionState,
  searchString,
) {
  let electionDistricts = {};

  let districtMap = {
    Borough: ['Borough_Ward'],
    City:
      officeName.includes('Commission') || officeName.includes('Council')
        ? ['City_Council_Commissioner_District', 'City_Ward']
        : ['City_Ward'],
    County: officeName.includes('Supervisor')
      ? ['County_Supervisorial_District']
      : officeName.includes('Commissioner')
      ? ['County_Commissioner_District', 'County_Legislative_District']
      : officeName.includes('Precinct')
      ? ['Precinct']
      : ['County_Commissioner_District'],
    Town_District: ['Town_Ward'],
    Township: ['Township_Ward'],
    Village: ['Village_Ward'],
  };

  for (const column of electionTypes) {
    if (districtMap[column.column]) {
      console.log('searching for sub columns', districtMap[column.column]);

      let subColumns = await getSearchColumn(
        districtMap[column.column],
        electionState,
        searchString,
        column.value, // ie: 'CA##RIVERSIDE CITY'
      );
      if (subColumns.length > 0) {
        console.log('found sub columns', subColumns);
        electionDistricts[column.column] = subColumns;
        break;
      }
    }
  }
  console.log('electionDistricts (officeHelper)', electionDistricts);
  return electionDistricts;
}

function determineSearchColumns(electionLevel, officeName) {
  let searchColumns = [];
  if (electionLevel === 'federal') {
    if (officeName.includes('President of the United States')) {
      searchColumns = [''];
    } else {
      searchColumns = ['US_Congressional_District'];
    }
  } else if (electionLevel === 'state') {
    if (officeName.includes('Senate') || officeName.includes('Senator')) {
      searchColumns = ['State_Senate_District'];
    } else if (
      officeName.includes('House') ||
      officeName.includes('Assembly') ||
      officeName.includes('Representative')
    ) {
      searchColumns = ['State_House_District'];
    }
  } else if (electionLevel === 'county') {
    searchColumns = ['County'];
  } else if (electionLevel === 'city' || electionLevel === 'local') {
    if (officeName.includes('Township') || officeName.includes('TWP')) {
      searchColumns = ['Township', 'Town_District', 'Town_Council'];
    } else if (officeName.includes('Village') || officeName.includes('VLG')) {
      searchColumns = ['Village', 'City', 'Town_District'];
    } else if (officeName.includes('Hamlet')) {
      searchColumns = ['Hamlet_Community_Area', 'City', 'Town_District'];
    } else if (officeName.includes('Borough')) {
      searchColumns = ['Borough', 'City', 'Town_District'];
    } else {
      searchColumns = [
        'City',
        'Town_District',
        'Town_Council',
        'Hamlet_Community_Area',
        'Village',
        'Borough',
        'Township',
      ];
    }
  } else {
    return exits.badRequest({
      error: true,
      message: 'Invalid electionLevel',
    });
  }
  return searchColumns;
}

async function searchMiscDistricts(officeName, state) {
  // Populate the miscellaneous districts from the database.
  const results = await ElectionType.find({ state });

  if (!results || results.length === 0) {
    console.log(
      `Error! No ElectionType results found for state ${state}. You may need to run seed election-types.`,
    );
    await sails.helpers.sendSlackMessage(
      `Error! No ElectionType results found for state ${state}. You may need to run seed election-types.`,
    );
    return [];
  }

  let miscellaneousDistricts = [];
  for (const result of results) {
    if (result?.name && result?.category) {
      miscellaneousDistricts.push(result.name);
    }
  }

  // Use AI to find the best matches for the office name.
  let foundMiscDistricts = [];
  const matchResp = await matchSearchColumns(
    miscellaneousDistricts,
    officeName,
  );
  console.log('matchResp', matchResp);
  if (matchResp && matchResp?.content) {
    try {
      const contentJson = JSON.parse(matchResp.content);
      console.log('columns', contentJson.columns);
      foundMiscDistricts = contentJson?.columns || [];
    } catch (e) {
      console.log('error parsing matchResp', e);
    }
  }

  return foundMiscDistricts;
}

// Deprecated.
async function searchMiscDistrictsSimilarity(officeName, state) {
  const results = await ElectionType.find({ state });
  let miscellaneousDistricts = {};
  for (const result of results) {
    if (result?.name && result?.category) {
      if (!miscellaneousDistricts[result.category]) {
        miscellaneousDistricts[result.category] = [];
      }
      miscellaneousDistricts[result.category].push(result.name);
    }
  }

  let foundMiscDistricts = [];
  let similarityScores = {};
  for (const districtType of Object.keys(miscellaneousDistricts)) {
    for (const district of miscellaneousDistricts[districtType]) {
      let formattedDistrict = district.replace(/_/g, ' ');
      formattedDistrict = normalizeString(formattedDistrict);
      formattedDistrict = formattedDistrict.replace(/\ district/g, '');
      formattedDistrict = formattedDistrict.replace(/judicial\ /g, '');
      formattedDistrict = formattedDistrict.replace(/apellate/g, 'appeals');

      const officeLower = normalizeString(officeName);
      if (formattedDistrict !== '' && officeLower.includes(formattedDistrict)) {
        console.log('found district', formattedDistrict);
        foundMiscDistricts.push(district);
      } else {
        // todo: consider detecting the type/category of district and only searching for that type.
        const officeWords = officeLower.split(' ');
        const districtWords = formattedDistrict.split(' ');
        const similarity = jaccardSimilarity(officeWords, districtWords);
        if (similarity && similarity > 0.3) {
          console.log('similarity', district, similarity);
          similarityScores[district] = similarity;
        }
      }
    }
  }

  if (Object.keys(similarityScores).length === 0) {
    return foundMiscDistricts;
  }
  // sort the similarity scores and add the top 3 to the foundMiscDistricts
  const sortedSimilarityScores = Object.keys(similarityScores).sort(
    (a, b) => similarityScores[b] - similarityScores[a],
  );
  const topScores = sortedSimilarityScores.slice(0, 3);
  console.log('topScores', topScores);
  foundMiscDistricts = foundMiscDistricts.concat(topScores);
  return foundMiscDistricts;
}

function normalizeString(str) {
  return str.toLowerCase().replace(/[^a-z0-9]\ /g, '');
}

function jaccardSimilarity(array1, array2) {
  const set1 = new Set(array1);
  const set2 = new Set(array2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  const similarity = intersection.size / union.size;
  return similarity;
}

function getDistrictValue(officeName, subAreaName, subAreaValue) {
  let districtWords = [
    'District',
    'Ward',
    'Precinct',
    'Subdistrict',
    'Division',
    'Circuit',
    'Position',
    'Seat',
    'Place',
    'Group',
    'Court',
    'Courthouse',
    'Department',
    'Area',
    'Office',
    'Post',
  ];

  let districtValue;
  if (subAreaName || subAreaValue) {
    if (!subAreaValue && !isNaN(subAreaValue)) {
      for (const word of districtWords) {
        if (officeName.includes(word)) {
          const regex = new RegExp(`${word} ([0-9]+)`);
          const match = officeName.match(regex);
          if (match) {
            districtNumber = match[1];
          } else {
            // could not find a district number in officeName, it's probably a word like a county.
            districtValue = subAreaValue;
          }
        }
      }
    } else {
      // subAreaValue is a number lets use that.
      districtValue = subAreaValue;
    }
  }
  if (districtValue) {
    districtValue = districtValue.trim();
  }

  return districtValue;
}

async function querySearchColumn(searchColumn, electionState) {
  let searchValues = [];
  try {
    let searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/column/values/1OSR/VM_${electionState}/${searchColumn}?id=1OSR&apikey=${l2ApiKey}`;
    const response = await axios.get(searchUrl);
    if (response?.data?.values && response.data.values.length > 0) {
      searchValues = response.data.values;
    }
  } catch (e) {
    console.log('error at querySearchColumn', e);
  }
  return searchValues;
}

async function matchSearchColumns(searchColumns, searchString) {
  const functionDefinition = {
    type: 'function',
    function: {
      name: 'matchColumns',
      description: 'Determine the columns that best match the office name.',
      parameters: {
        type: 'object',
        properties: {
          columns: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'The list of columns that best match the office name.',
            maxItems: 5,
          },
        },
        required: ['columns'],
      },
    },
  };

  const completion = await getChatCompletion(
    [
      {
        role: 'system',
        content:
          'You are a political assistant whose job is to find the top 5 columns that match the office name (ordered by the most likely at the top). If none of the labels are a good match then you will return an empty column array. Make sure you only return columns that are extremely relevant. For Example: for a City Council position you would not return a State position or a School District position.',
      },
      {
        role: 'user',
        content: `Find the top 5 columns that matches the following office: "${searchString}.\n\nColumns: ${searchColumns}"`,
      },
    ],
    'gpt-4o',
    0.1,
    0.1,
    [functionDefinition],
  );

  return completion;
}

async function matchSearchValues(searchValues, searchString) {
  let messages = [
    {
      role: 'system',
      content: `
      you are a helpful political assistant whose job is to find the label that most closely matches the input. You will return only the matching label in your response and nothing else. If none of the labels are a good match then you will return "". If there is a good match return the entire label including any hashtags. 
        `,
    },
    {
      role: 'user',
      content: `find the label that matches the following office: "${searchString}.\n\nLabels: ${searchValues}"`,
    },
  ];

  const completion = await sails.helpers.ai.createCompletion(
    messages,
    100,
    0.1,
    0.1,
  );

  const content = completion?.content;
  const tokens = completion?.tokens;
  if (!tokens || tokens === 0) {
    // ai failed. throw an error here, we catch it in consumer.
    // and re-throw it so we can try again via the SQS queue.
    throw new Error('no response from AI');
  }

  if (content && content !== '') {
    return content.replace(/"/g, '');
  }
}
function getSearchString(
  officeName,
  subAreaName,
  subAreaValue,
  electionCounty,
  electionMunicipality,
  electionState,
) {
  let searchString = officeName;
  if (subAreaName) {
    searchString += `- ${subAreaName}`;
  }
  if (subAreaValue) {
    searchString += `- ${subAreaValue}`;
  }
  if (electionCounty) {
    searchString += `- ${electionCounty}`;
  }
  if (electionMunicipality) {
    searchString += `- ${electionMunicipality}`;
  }
  if (electionState) {
    searchString += `- ${electionState}`;
  }
  return searchString;
}

async function getSearchColumn(
  searchColumns,
  electionState,
  searchString,
  searchString2,
) {
  let foundColumns = [];
  //   console.log('searchColumns', searchColumns);
  //   console.log('searchString', searchString);
  //   console.log('searchString2', searchString2);
  let search = searchString;
  if (searchString2) {
    search = `${searchString} ${searchString2}`;
  }
  for (const searchColumn of searchColumns) {
    let searchValues = await querySearchColumn(searchColumn, electionState);
    // strip out any searchValues that are a blank string ""
    searchValues = searchValues.filter((value) => value !== '');
    if (searchValues.length > 0) {
      const match = await matchSearchValues(searchValues.join('\n'), search);
      if (
        match &&
        match !== '' &&
        match !== `${electionState}##` &&
        match !== `${electionState}####`
      ) {
        foundColumns.push({
          column: searchColumn,
          value: match.replaceAll('"', ''),
        });
      }
    }

    // for (const searchValue of searchValues) {
    //   if (searchValue.toLowerCase().includes(searchString.toLowerCase())) {
    //     // console.log(`found (searchValue) ${searchValue} for ${searchString}`);
    //     if (searchString2) {
    //       if (searchValue.toLowerCase().includes(searchString2.toLowerCase())) {
    //         // console.log(
    //         //   `found (searchValue2) ${searchValue} for ${searchString2}`,
    //         // );
    //         foundColumns.push({ column: searchColumn, value: searchValue });
    //       }
    //     } else {
    //       foundColumns.push({ column: searchColumn, value: searchValue });
    //     }
    //   }
    // }
  }

  console.log('office helper foundColumns', foundColumns);

  return foundColumns;
}
