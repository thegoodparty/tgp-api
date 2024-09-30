const axios = require('axios');
const lodash = require('lodash');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

async function getGenderCounts(electionState, searchJson) {
  let counts = {
    women: 0,
    men: 0,
  };

  let countsJson = lodash.cloneDeep(searchJson);
  countsJson.format = 'counts';
  countsJson.columns = ['Voters_Gender'];

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
    if (!item?.Voters_Gender) {
      continue;
    }
    if (item.Voters_Gender === 'M') {
      counts.men += item.__COUNT;
    } else if (item.Voters_Gender === 'F') {
      counts.women += item.__COUNT;
    }
  }
  return counts;
}

module.exports = {
  getGenderCounts,
};
