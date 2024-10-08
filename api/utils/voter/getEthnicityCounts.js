const axios = require('axios');
const lodash = require('lodash');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

async function getEthnicityCounts(electionState, searchJson) {
  let counts = {
    white: 0,
    asian: 0,
    hispanic: 0,
    africanAmerican: 0,
  };

  let countsJson = lodash.cloneDeep(searchJson);
  countsJson.format = 'counts';
  countsJson.columns = ['EthnicGroups_EthnicGroup1Desc'];

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
    if (!item?.EthnicGroups_EthnicGroup1Desc) {
      continue;
    }
    if (item.EthnicGroups_EthnicGroup1Desc === 'European') {
      counts.white += item.__COUNT;
    } else if (item.EthnicGroups_EthnicGroup1Desc.includes('Asian')) {
      counts.asian += item.__COUNT;
    } else if (item.EthnicGroups_EthnicGroup1Desc.includes('Hispanic')) {
      counts.hispanic += item.__COUNT;
    } else if (item.EthnicGroups_EthnicGroup1Desc.includes('African')) {
      counts.africanAmerican += item.__COUNT;
    }
  }
  return counts;
}

module.exports = getEthnicityCounts;
