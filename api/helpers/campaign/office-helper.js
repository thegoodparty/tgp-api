const axios = require('axios');
const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

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

      // If we don't find a misc district we fall back to state/county/city.
      if (electionTypes.length === 0) {
        sails.helpers.log(
          slug,
          'no miscDistrict found. falling back to state/county/city',
        );
        // if (electionLevel === 'county' && electionCounty) {
        //   electionSearch = electionCounty;
        // } else if (electionLevel === 'city' && electionMunicipality) {
        //   electionSearch = electionMunicipality;
        // } else {
        //   // Note: we may want to search for the long AND short state to maximize match.
        //   electionSearch = electionState; // await sails.helpers.zip.shortToLongState(electionState);
        //   electionSearch2 = formattedDistrictValue;
        // }
        let searchColumns = await determineSearchColumns(
          slug,
          electionLevel,
          officeName,
        );
        if (searchColumns.length > 0) {
          sails.helpers.log(slug, 'determined searchColumns', searchColumns);
          electionTypes = await getSearchColumn(
            slug,
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
          slug,
          officeName,
          electionTypes,
          electionState,
          searchString,
          //districtValue,
        );
      }

      try {
        sails.helpers.log(
          slug,
          `electionTypes: ${JSON.stringify(
            electionTypes,
          )}. electionDistricts: ${JSON.stringify(electionDistricts)}`,
        );
      } catch (e) {
        console.log('json error logging electionTypes', e);
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
  slug,
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
      sails.helpers.log(
        slug,
        'searching for sub columns',
        districtMap[column.column],
      );

      let subColumns = await getSearchColumn(
        slug,
        districtMap[column.column],
        electionState,
        searchString,
        column.value, // ie: 'CA##RIVERSIDE CITY'
      );
      if (subColumns.length > 0) {
        sails.helpers.log(slug, 'found sub columns', subColumns);
        electionDistricts[column.column] = subColumns;
        break;
      }
    }
  }
  sails.helpers.log(
    slug,
    'electionDistricts (officeHelper)',
    electionDistricts,
  );
  return electionDistricts;
}

async function determineSearchColumns(slug, electionLevel, officeName) {
  sails.helpers.log(
    slug,
    `determining Search Columns for ${officeName}. level: ${electionLevel}`,
  );
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
    await sails.helpers.slack.slackHelper(
      {
        title: 'Path To Victory',
        body: `Error! ${slug} Invalid electionLevel ${electionLevel}`,
      },
      'victory-issues',
    );
    return exits.badRequest({
      error: true,
      message: 'Invalid electionLevel',
    });
  }
  return searchColumns;
}

function getDistrictValue(slug, officeName, subAreaName, subAreaValue) {
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

  sails.helpers.log(
    slug,
    `getting DistrictValue: ${officeName}. subAreaName: ${subAreaName}. subAreaValue: ${subAreaValue}`,
  );

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

async function querySearchColumn(slug, searchColumn, electionState) {
  let searchValues = [];
  try {
    let searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/column/values/1OSR/VM_${electionState}/${searchColumn}?id=1OSR&apikey=${l2ApiKey}`;
    const response = await axios.get(searchUrl);
    if (response?.data?.values && response.data.values.length > 0) {
      searchValues = response.data.values;
    }
  } catch (e) {
    sails.helpers.log(slug, 'error at querySearchColumn', e);
  }
  return searchValues;
}

function getSearchString(
  slug,
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
  sails.helpers.log(slug, `searchString: ${searchString}`);
  return searchString;
}
