async function searchLocationDistricts(
  slug,
  electionLevel,
  officeName,
  subAreaName,
  subAreaValue,
) {
  let searchColumns = [];
  try {
    searchColumns = await determineSearchColumns(
      slug,
      electionLevel,
      officeName,
    );
  } catch (error) {
    sails.helpers.log(slug, 'error', error);
  }

  let districtValue = getDistrictValue(
    slug,
    officeName,
    subAreaName,
    subAreaValue,
  );

  let subColumns = [];
  if (
    electionLevel !== 'federal' &&
    electionLevel !== 'state' &&
    searchColumns.length > 0 &&
    districtValue
  ) {
    subColumns = determineElectionDistricts(slug, searchColumns, officeName);
  }

  if (subColumns.length > 0) {
    // if we have subColumns, we want to prioritize them at the top.
    // since they are more specific.
    sails.helpers.log(slug, 'adding to searchColumns', subColumns);
    searchColumns = subColumns.concat(searchColumns);
  }

  return searchColumns;
}

function determineElectionDistricts(slug, searchColumns, officeName) {
  let subColumns = [];

  // This district map is used to determine which sub columns to search for.
  // it was provided by L2.
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

  for (const column of searchColumns) {
    sails.helpers.log(slug, 'searching for sub columns', column);
    if (districtMap[column]) {
      sails.helpers.log(
        slug,
        'adding to searchColumns',
        ...districtMap[column],
      );
      subColumns.push(...districtMap[column]);
    }
  }
  sails.helpers.log(slug, 'electionDistricts', subColumns);
  return subColumns;
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

module.exports = searchLocationDistricts;
