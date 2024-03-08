const axios = require('axios');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

module.exports = {
  friendlyName: 'Office Helper',

  inputs: {
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
      foundMiscDistricts = searchMiscDistricts(officeName);

      if (foundMiscDistricts.length > 0) {
        searchColumns = foundMiscDistricts;
      }
      console.log('searchColumns', searchColumns);

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
      console.log('electionTypes', electionTypes);

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
      : officeName.includes('Precinct') || officeName.includes()
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

function searchMiscDistricts(officeName) {
  const miscellaneousDistricts = {
    City: [
      'City_Council_Commissioner_District',
      'City_Mayoral_District',
      'Election_Commissioner_District',
      'Proposed_City_Commissioner_District',
    ],
    State: [
      'State_Senate_District',
      'State_House_District',
      'US_Congressional_District',
    ],
    Education: [
      'City_School_District',
      'College_Board_District',
      'Community_College_Commissioner_District',
      'Community_College_SubDistrict',
      'County_Board_of_Education_District',
      'County_Board_of_Education_SubDistrict',
      'County_Community_College_District',
      'County_Legislative_District',
      'County_Superintendent_of_Schools_District',
      'County_Unified_School_District',
      'Board_of_Education_District',
      'Board_of_Education_SubDistrict',
      'Education_Commission_District',
      'Educational_Service_District',
      'Elementary_School_District',
      'Elementary_School_SubDistrict',
      'Exempted_Village_School_District',
      'High_School_District',
      'High_School_SubDistrict',
      'Middle_School_District',
      'Proposed_Elementary_School_District',
      'Proposed_Unified_School_District',
      'Regional_Office_of_Education_District',
      'School_Board_District',
      'School_District',
      'School_District_Vocational',
      'School_Facilities_Improvement_District',
      'School_Subdistrict',
      'Service_Area_District',
      'Superintendent_of_Schools_District',
      'Unified_School_District',
      'Unified_School_SubDistrict',
    ],
    Judicial: [
      'District_Attorney',
      'Judicial_Appellate_District',
      'Judicial_Circuit_Court_District',
      'Judicial_County_Board_of_Review_District',
      'Judicial_County_Court_District',
      'Judicial_District',
      'Judicial_District_Court_District',
      'Judicial_Family_Court_District',
      'Judicial_Jury_District',
      'Judicial_Juvenile_Court_District',
      'Judicial_Sub_Circuit_District',
      'Judicial_Superior_Court_District',
      'Judicial_Supreme_Court_District',
      'Municipal_Court_District',
      'Judicial_Magistrate_Division',
    ],
  };

  let foundMiscDistricts = [];
  for (const districtType of Object.keys(miscellaneousDistricts)) {
    for (const district of miscellaneousDistricts[districtType]) {
      formattedDistrict = district.replace(/_/g, ' ');
      formattedDistrict = formattedDistrict.replace(/\ District/g, '');
      formattedDistrict = formattedDistrict.replace(/Judicial\ /g, '');

      // TODO: Replace Apellate with Appeals.
      // TODO: modify this to use jaccard similarity or another fuzzy match (levenshtein distance)
      // where array A and array B are a set of words from the officeName and formattedDistrict (with punctuation removed) and casing normalized.
      // const similarity = jaccardSimilarity(arrayA, arrayB);
      // console.log(`Jaccard Similarity: ${similarity}`);
      // and then select only the highest similarity.
      if (
        formattedDistrict !== '' &&
        officeName.toLowerCase().includes(formattedDistrict.toLowerCase())
      ) {
        console.log('found district', formattedDistrict);
        foundMiscDistricts.push(district);
      }
    }
  }
  return foundMiscDistricts;
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
    console.log('subAreaName', subAreaName);
    console.log('subAreaValue', subAreaValue);

    if (!subAreaValue && !isNaN(subAreaValue)) {
      for (const word of districtWords) {
        if (officeName.includes(word)) {
          const regex = new RegExp(`${word} ([0-9]+)`);
          const match = officeName.match(regex);
          if (match) {
            console.log('found district number in office name:', match);
            districtNumber = match[1];
          } else {
            console.log('did not find district number in office name');
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
  console.log('districtValue', districtValue);

  return districtValue;
}

async function querySearchColumn(searchColumn, electionState) {
  let searchValues = [];
  try {
    let searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/column/values/1OSR/VM_${electionState}/${searchColumn}?id=1OSR&apikey=${l2ApiKey}`;
    console.log('searchUrl', searchUrl);
    const response = await axios.get(searchUrl);
    if (response?.data?.values && response.data.values.length > 0) {
      searchValues = response.data.values;
    }
  } catch (e) {
    console.log('error at querySearchColumn', e);
  }
  return searchValues;
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
  console.log('ai search result', content);
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
    console.log(`querying ${searchColumn} for ${search}`);
    let searchValues = await querySearchColumn(searchColumn, electionState);
    // strip out any searchValues that are a blank string ""
    searchValues = searchValues.filter((value) => value !== '');
    console.log('searchValues', searchValues.length);
    if (searchValues.length > 0) {
      const match = await matchSearchValues(searchValues.join('\n'), search);
      if (match && match !== '' && match !== `${electionState}##`) {
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

  return foundColumns;
}
