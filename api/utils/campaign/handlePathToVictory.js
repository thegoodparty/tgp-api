const searchMiscDistricts = require('./searchMiscDistricts');
const searchLocationDistricts = require('./searchLocationDistricts');
const getSearchColumn = require('./getSearchColumn');

const handlePathToVictory = async ({
  slug,
  officeName,
  electionDate,
  electionTerm,
  electionLevel,
  electionState,
  electionCounty,
  electionMunicipality,
  subAreaName,
  subAreaValue,
  partisanType,
  priorElectionDates,
  electionType,
  electionLocation,
}) => {
  let pathToVictoryResponse = {
    electionType: '',
    electionLocation: '',
    district: '',
    counts: {
      total: 0,
      democrat: 0,
      republican: 0,
      independent: 0,
    },
  };

  sails.helpers.log(slug, 'starting p2v');

  try {
    let searchColumns = [];
    let searchString = '';

    if (!electionType || !electionLocation) {
      if (
        !officeName.includes('At Large') &&
        !officeName.includes('President of the United States') &&
        !officeName.includes('Senate') &&
        !officeName.includes('Governor') &&
        !officeName.includes('Mayor')
      ) {
        searchColumns = await searchMiscDistricts(
          slug,
          officeName,
          electionLevel,
          electionState,
        );
      }

      let locationColumns = await searchLocationDistricts(
        slug,
        electionLevel,
        officeName,
        subAreaName,
        subAreaValue,
      );

      if (locationColumns.length > 0) {
        sails.helpers.log(slug, 'locationColumns', locationColumns);
        // prioritize misc districts over location districts.
        searchColumns = searchColumns.concat(locationColumns);
      }

      sails.helpers.log(slug, 'searchColumns', searchColumns);

      if (searchColumns.length > 0) {
        searchString = getSearchString(
          slug,
          officeName,
          subAreaName,
          subAreaValue,
          electionCounty,
          electionMunicipality,
          electionState,
        );
      }
    } else {
      // if electionType and electionLocation are already specified
      searchColumns = [''];
    }

    let attempts = 1;
    for (const searchColumn of searchColumns) {
      let columnResponse;
      console.log('searchColumn', searchColumn);
      console.log('attempt', attempts);
      if (
        electionLevel === 'federal' &&
        (officeName.includes('President of the United States') ||
          officeName.includes('Senate'))
      ) {
        electionType = '';
        electionLocation = '';
      } else if (officeName.includes('Governor')) {
        electionType = '';
        electionLocation = '';
      } else if (electionType && electionLocation) {
        // if already specified, skip the search.
      } else {
        columnResponse = await getSearchColumn(
          slug,
          searchColumn,
          electionState,
          searchString,
        );
        console.log('columnResponse', columnResponse);

        if (!columnResponse) {
          continue;
        }
        console.log('columnResponse', columnResponse);
        electionType = columnResponse.column;
        electionLocation = columnResponse.value;
      }

      if (electionType === undefined || electionLocation === undefined) {
        continue;
      }

      sails.helpers.log(
        slug,
        `Found Column! Election Type: ${electionType}. Location: ${electionLocation}  Attempting to get counts ...`,
      );

      if (officeName === 'President of the United States') {
        // special case for President.
        electionState = 'US';
      }

      const counts = await sails.helpers.campaign.countHelper(
        electionTerm,
        electionDate ? electionDate : new Date().toISOString().slice(0, 10),
        electionState,
        electionType,
        electionLocation,
        partisanType,
        priorElectionDates,
      );
      sails.helpers.log(slug, 'counts', counts);

      if (counts && counts?.total && counts.total > 0) {
        pathToVictoryResponse.electionType = electionType;
        pathToVictoryResponse.electionLocation = electionLocation;
        pathToVictoryResponse.counts = counts;
        await saveL2Counts(counts, electionType, electionLocation);
        break;
      } else {
        electionType = undefined;
        electionLocation = undefined;
      }
      attempts++;
      if (attempts > 10) {
        // we now limit searchColumn attempts to 10.
        break;
      }
    }

    return {
      slug,
      pathToVictoryResponse,
      officeName,
      electionDate,
      electionTerm,
      electionLevel,
      electionState,
      electionCounty,
      electionMunicipality,
      subAreaName,
      subAreaValue,
      partisanType,
    };
  } catch (e) {
    sails.helpers.log(slug, 'error in handle-p2v', e);
    await sails.helpers.slack.errorLoggerHelper('error in handle-p2v', e);
    throw new Error('error in handle-p2v');
  }
};

async function saveL2Counts(counts, electionType, electionLocation) {
  if (electionType && electionLocation && electionType !== '') {
    try {
      const existingObj = await l2Count.findOne({
        electionType: electionType,
        electionLocation: electionLocation,
      });
      if (existingObj) {
        await l2Count
          .updateOne({
            electionType: electionType,
            electionLocation: electionLocation,
            electionDistrict: '',
          })
          .set({
            counts: counts,
          });
      } else {
        await l2Count.create({
          electionType: electionType,
          electionLocation: electionLocation,
          electionDistrict: '',
          counts: counts,
        });
      }
    } catch (e) {
      console.log('error saving l2Count', e);
    }
  }
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

module.exports = handlePathToVictory;
