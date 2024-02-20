const axios = require('axios');
const lodash = require('lodash');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

module.exports = {
  friendlyName: 'l2-data API Helper',

  inputs: {
    electionTerm: {
      type: 'number',
      required: true,
    },
    // should be YYYY-MM-DD
    electionDate: {
      type: 'string',
      required: true,
    },
    electionState: {
      type: 'string',
      required: true,
    },
    electionType: {
      type: 'string',
      required: true,
    },
    electionLocation: {
      type: 'string',
      required: true,
    },
    electionDistrict: {
      type: 'string',
    },
    partisanType: {
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
      let {
        electionTerm,
        electionDate,
        electionState,
        electionType,
        electionLocation,
        electionDistrict,
        partisanType,
      } = inputs;

      console.log(`countHelper invoked with ${JSON.stringify(inputs)}`);

      let searchJson = {
        filters: {},
      };

      if (electionType && electionType !== '') {
        searchJson.filters[electionType] = electionLocation;
      }
      if (electionDistrict && electionDistrict !== '') {
        searchJson.filters[electionType] = electionDistrict;
      }

      let counts = await getPartisanCounts(electionState, searchJson);
      console.log('counts', counts);

      if (counts.total === 0) {
        // don't get electionHistory if we don't have a match.
        exits.success(counts);
      }

      // Now we try to determine the turnout for the last 3 elections.
      // with the goal to determine averageTurnout and projectedTurnout
      let columns = await getColumns(electionState);

      let numberOfElections = 3;
      // if (electionTerm >= 4) {
      //   // for longer terms we only want to look at the last 2 elections. (deprecated)
      //   numberOfElections = 2;
      // }

      if (
        electionType === 'State_House_District' ||
        electionType === 'State_Senate_District' ||
        electionType === 'US_House_District' ||
        electionType === 'US_Senate' ||
        partisanType === 'partisan'
      ) {
        // update the electionDate to the first Tuesday of November.
        let year = electionDate.split('-')[0];
        const electionDateObj = getFirstTuesdayOfNovember(year);
        electionDate = electionDateObj.toISOString().slice(0, 10);
        console.log('updated electionDate to GE date:', electionDate);
      }

      let foundColumns = [];
      for (let y = 0; y < numberOfElections; y++) {
        let columnResults = determineHistoryColumn(
          electionDate,
          electionState,
          electionTerm * (y + 1),
          columns,
        );
        if (columnResults?.column) {
          foundColumns.push(columnResults);
        }
      }
      console.log('foundColumns', foundColumns);

      // get the counts for each of the 3 years.
      let turnoutCounts = [];
      for (const column of foundColumns) {
        let historyJson = lodash.cloneDeep(searchJson);
        historyJson.filters[column.column] = 1;
        console.log('historyJson', historyJson);
        let estimatedCount = await getEstimatedCounts(
          electionState,
          historyJson,
        );
        console.log(`estimatedCount ${column.column} `, estimatedCount);
        if (estimatedCount > 0) {
          turnoutCounts.push(estimatedCount);
        }
      }

      // update counts with the average and projected turnouts.
      counts = getProjectedTurnout(counts, turnoutCounts);
      console.log('counts', counts);

      return exits.success(counts);
    } catch (e) {
      console.log('error at count-helper', e);
      return exits.success('');
    }
  },
};

function getFirstTuesdayOfNovember(year) {
  // Month in JavaScript is 0-indexed, so November is represented by 10
  const november = new Date(year, 10, 1);

  // Get the day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
  const dayOfWeek = november.getDay();

  // Calculate the number of days to add to reach the first Tuesday
  const daysToAdd = (2 + 7 - dayOfWeek) % 7;

  // Set the date to the first Tuesday of November
  november.setDate(1 + daysToAdd);

  return november;
}

function getProjectedTurnout(counts, turnoutCounts) {
  // Note: l2 lacks data for number of registered voters at a point in time.
  // so we calculate turnout for all prior years based on current registered voters.
  // which is flawed but the best we can do with the current data.
  let averageTurnout = getAverageTurnout(turnoutCounts);

  let trajectory = 0;
  if (turnoutCounts.length > 1) {
    // the trajectory is the difference between the last 2 elections
    trajectory = turnoutCounts[0] - turnoutCounts[1];
  }

  let averageTurnoutPercent = 0;
  if (averageTurnout > 0 && counts.total > 0) {
    averageTurnoutPercent = (averageTurnout / counts.total).toFixed(2);
  }
  counts.averageTurnout = averageTurnout;
  counts.averageTurnoutPercent =
    (averageTurnoutPercent * 100).toFixed(2).toString() + '%';

  // Calculate the projected turnout.
  // TODO: Jared will revise the strategy in this section.
  let projectedTurnout = 0;
  if (trajectory > 0) {
    // turnout is increasing. so we project turnout will be grow by the trajectory.
    // but we include it as part of the averaging formula so as not to overestimate.
    // this may be too conservative and we might need to weight more recent elections more heavily.
    let nextTurnout = averageTurnout + trajectory;
    turnoutCounts.push(nextTurnout);
    projectedTurnout = getAverageTurnout(turnoutCounts);
  } else {
    projectedTurnout = Math.ceil(averageTurnoutPercent * counts.total);
  }
  let projectedTurnoutPercent = 0;
  if (projectedTurnout > 0 && counts.total > 0) {
    projectedTurnoutPercent = (projectedTurnout / counts.total).toFixed(2);
  }
  counts.projectedTurnout = projectedTurnout;
  counts.projectedTurnoutPercent =
    (projectedTurnoutPercent * 100).toFixed(2).toString() + '%';

  // Currently win number is projected turnout x .5001 and voter contact is win number x 5
  if (projectedTurnout && projectedTurnout > 0) {
    const winNumber = Math.ceil(projectedTurnout * 0.5001).toFixed(2);
    const voterContactGoal = Math.ceil(winNumber * 5).toFixed(2);
    counts.winNumber = winNumber;
    counts.voterContactGoal = voterContactGoal;
  }
  return counts;
}

function getAverageTurnout(turnoutCounts) {
  // We look at the trajectory of the registered voters over the last elections.
  // and if it is increasing or decreasing we use that to calculate the projected turnout.
  let totalTurnout = 0;
  for (const count of turnoutCounts) {
    // Note: other approaches we can consider are discarding turnouts from the average
    // that are too high or too low.
    totalTurnout += count;
  }
  let averageTurnout = Math.ceil(totalTurnout / turnoutCounts.length);
  console.log('averageTurnout', averageTurnout);
  return averageTurnout;
}

async function getColumns(electionState) {
  let columns = [];
  let columnsUrl = `https://api.l2datamapping.com/api/v2/customer/application/columns/1OSR/VM_${electionState}/?id=1OSR&apikey=${l2ApiKey}`;
  let columnsResponse;
  try {
    columnsResponse = await axios.get(columnsUrl);
  } catch (e) {
    console.log('error getting columns', e);
  }
  if (columnsResponse?.data?.columns) {
    columns = columnsResponse.data.columns;
  }
  return columns;
}

async function getPartisanCounts(electionState, searchJson) {
  let counts = {
    total: 0,
    democrat: 0,
    republican: 0,
    independent: 0,
  };

  let countsJson = lodash.cloneDeep(searchJson);
  countsJson.format = 'counts';
  countsJson.columns = ['Parties_Description'];

  const searchUrl = `https://api.l2datamapping.com/api/v2/records/search/1OSR/VM_${electionState}?id=1OSR&apikey=${l2ApiKey}`;
  let response;
  try {
    response = await axios.post(searchUrl, countsJson);
  } catch (e) {
    console.log('error getting counts', e);
    return counts;
  }
  if (!response?.data || !response?.data?.length) {
    return counts;
  }

  for (const item of response.data) {
    counts.total += item.__COUNT;
    if (item.Parties_Description === 'Democratic') {
      counts.democrat += item.__COUNT;
    } else if (item.Parties_Description === 'Republican') {
      counts.republican += item.__COUNT;
    } else {
      counts.independent += item.__COUNT;
    }
  }
  return counts;
}

async function getEstimatedCounts(electionState, searchJson) {
  let count = 0;
  // Note: this endpoint also returns # of households which we don't use.
  // This endpoint could use same query as getPartisanCounts but we use a different endpoint
  // but if we need partisan election counts we can use the same endpoint.
  const searchUrl = `https://api.l2datamapping.com/api/v2/records/search/estimate/1OSR/VM_${electionState}?id=1OSR&apikey=${l2ApiKey}`;
  let response;
  try {
    response = await axios.post(searchUrl, searchJson);
  } catch (e) {
    console.log('error getting counts', e);
    return count;
  }
  if (!response?.data || !response?.data?.results) {
    return count;
  }

  return response.data.results?.count || count;
}

function getElectionClassification(electionKeyType) {
  if (electionKeyType === 'EG') {
    return 'General Election';
  } else if (electionKeyType === 'ECG') {
    return 'Consolidated General Election';
  } else if (electionKeyType === 'EPP') {
    return 'Presidential Preference Primary';
  } else if (electionKeyType === 'EP') {
    return 'Primary Election';
  } else if (electionKeyType === 'ES') {
    return 'Special Election';
  } else if (electionKeyType === 'EL') {
    return 'Local Election';
  } else if (electionKeyType === 'ER') {
    return 'Runoff Election';
  } else if (electionKeyType === 'EPD') {
    return 'Democratic Election Primary';
  } else {
    return electionKeyType;
  }
}

function determineHistoryColumn(
  electionDate,
  electionState,
  yearOffset,
  columns,
) {
  let turnoutDateObj = new Date(electionDate);
  turnoutDateObj.setFullYear(turnoutDateObj.getFullYear() - yearOffset);

  let turnoutDates = [];
  turnoutDates.push(
    turnoutDateObj.toISOString().slice(0, 10).replace(/-/g, ''),
  );

  // get 3 calendar days before and after the turnoutDateObj
  // and add them to turnOutDates array.
  for (let i = 1; i < 4; i++) {
    let turnoutDateObjBefore = new Date(turnoutDateObj);
    let turnoutDateObjAfter = new Date(turnoutDateObj);
    turnoutDateObjBefore.setDate(turnoutDateObjBefore.getDate() - i);
    turnoutDateObjAfter.setDate(turnoutDateObjAfter.getDate() + i);
    turnoutDates.push(
      turnoutDateObjBefore.toISOString().slice(0, 10).replace(/-/g, ''),
    );
    turnoutDates.push(
      turnoutDateObjAfter.toISOString().slice(0, 10).replace(/-/g, ''),
    );
  }

  let yearColumn;
  let yearColumnType;
  let yearIndex;
  let dateKey;

  for (const column of columns) {
    if (column.type === 'ELECTION') {
      // column.id is the column we are after.
      // column.name is an object with the states as keys and the value as the electionKey
      // example electionKey: EG_19961105
      if (column.name[electionState]) {
        electionKey = column.name[electionState];
        // Note: we may want to ask the User if they are running in a Primary.
        // and only consider Primaries (EP) here if they are.
        if (electionKey.includes('_')) {
          const electionSplit = electionKey.split('_');
          const electionKeyType = electionSplit[0];
          const electionKeyDate = electionSplit[1];
          if (
            electionKeyType !== 'EG' &&
            electionKeyType !== 'ECG' &&
            electionKeyType !== 'EL' // &&
            // electionKeyType !== 'EP'
          ) {
            continue;
          }
          for (let x = 0; x < turnoutDates.length; x++) {
            let turnoutDate = turnoutDates[x];
            // since there is no way to know the exact date of the election,
            // we prioritize elections that are closer to the electionDate
            if (turnoutDate === electionKeyDate) {
              if (!yearIndex || x < yearIndex) {
                yearColumn = column.id;
                yearIndex = x;
                dateKey = electionKeyDate;
                yearColumnType = getElectionClassification(electionKeyType);
                break;
              }
            }
          }
        }
      }
    }
  }

  return {
    column: yearColumn,
    date: dateKey,
    type: yearColumnType,
  };
}
