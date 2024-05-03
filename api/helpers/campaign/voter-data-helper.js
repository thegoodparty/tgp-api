const axios = require('axios');
const fastCsv = require('fast-csv');
const { max, isArray } = require('lodash');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;
const appBase = sails.config.custom.appBase || sails.config.appBase;
let maxRecords = 100000;
if (appBase !== 'https://goodparty.org') {
  maxRecords = 10000;
}

module.exports = {
  friendlyName: 'Voter Data Helper',

  inputs: {
    campaignId: {
      type: 'string',
      required: true,
    },
    electionState: {
      type: 'string',
      required: true,
    },
    l2ColumnName: {
      type: 'string',
    },
    l2ColumnValue: {
      type: 'string',
    },
    additionalFilters: {
      type: 'json',
    },
    limitApproved: {
      type: 'boolean',
      defaultsTo: false,
    },
  },
  exits: {
    success: {
      description: 'OK',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const {
        campaignId,
        electionState,
        l2ColumnName,
        l2ColumnValue,
        additionalFilters,
        limitApproved,
      } = inputs;

      await sails.helpers.slack.errorLoggerHelper('voter data helper.', inputs);

      let campaign;
      try {
        campaign = await Campaign.findOne({ id: campaignId });
      } catch (e) {
        console.log('error finding campaign in voter-data-helper', e);
        return exits.success('error');
      }

      console.log(`voterDataHelper invoked with ${JSON.stringify(inputs)}`);

      let csvData = await getVoterData(
        electionState,
        l2ColumnName,
        l2ColumnValue,
        additionalFilters,
        campaign,
        limitApproved,
      );

      let voterData = [];
      if (csvData) {
        console.log('Parsing voter data');
        voterData = await parseVoterData(csvData);
        console.log(
          'Parsing voter data complete. Total voters:',
          voterData.length,
        );
        await sails.helpers.slack.errorLoggerHelper(
          `Parsing voter data complete. Total voters: ${voterData.length}`,
          {},
        );
      }

      let voterObjs = [];
      for (const voter of voterData) {
        // for (let i = 0; i < 50; i++) {
        // const voter = voterData[i];
        try {
          let voterObj = {};
          voterObj.voterId = voter.LALVOTERID;
          voterObj.address = voter.Residence_Addresses_AddressLine;
          voterObj.party = voter.Parties_Description;
          voterObj.state = voter.Residence_Addresses_State;
          voterObj.city = voter.Residence_Addresses_City;
          voterObj.zip = voter.Residence_Addresses_Zip;

          const address = `${voterObj.address} ${voterObj.city}, ${voterObj.state} ${voterObj.zip}`;
          const loc = await sails.helpers.geocoding.geocodeAddress(address);
          const { lat, lng, full, geoHash } = loc;
          voterObj.data = { ...voter, geoLocation: full };

          voterObj.lat = lat;
          voterObj.lng = lng;
          voterObj.geoHash = geoHash;
          voterObjs.push(voterObj);
        } catch (e) {
          await sails.helpers.slack.errorLoggerHelper(
            `Error parsing a specific voter`,
            { error: e, voter },
          );
        }
      }
      console.log('Adding voters to db. Total voters:', voterObjs.length);

      await sails.helpers.slack.errorLoggerHelper(
        'Adding voters to db. Total voters:',
        {
          totalVoters: voterObjs.length,
        },
      );

      // createEach wont work because we need to find it first to see if it exists.
      // const voters = await Voter.createEach(voterObjs)
      //   .fetch()
      //   .tolerate('E_UNIQUE');

      if (voterObjs.length > 0) {
        for (const voterObj of voterObjs) {
          try {
            const voter = await Voter.findOrCreate(
              { voterId: voterObj.voterId },
              voterObj,
            );
            await Campaign.addToCollection(campaign.id, 'voters', voter.id);
            // because sails does not have unique_together we must do this.
            await VoterSearch.findOrCreate(
              {
                voter: voter.id,
                l2ColumnName,
                l2ColumnValue,
              },
              {
                voter: voter.id,
                l2ColumnName,
                l2ColumnValue,
              },
            );
          } catch (e) {
            await sails.helpers.slack.errorLoggerHelper(
              'Error adding voters',
              e,
            );
            console.log('error at voter-data-helper', e);
          }
        }
        console.log(
          `Added ${voterObjs.length} voter records to campaign ${campaign.slug}.`,
        );
        await sails.helpers.slack.slackHelper(
          simpleSlackMessage(
            'Voter Data',
            `Added ${voterObjs.length} voter records to campaign ${campaign.slug}.`,
          ),
          'victory',
        );
      }
      console.log('updating campaing data to completed');
      const updated = await Campaign.findOne({ id: campaignId });
      await Campaign.updateOne({ id: campaignId }).set({
        data: { ...updated.data, hasVoterFile: 'completed' },
      });
      await sails.helpers.slack.errorLoggerHelper(
        'Voter file purchase completed',
        {
          slug: updated.slug,
        },
      );

      return exits.success('ok');
    } catch (e) {
      console.log('error at voter-data-helper', e);
      await sails.helpers.slack.errorLoggerHelper(
        'error at voter-data-helper.',
        e,
      );
      return exits.success('error');
    }
  },
};

async function parseVoterData(csvData) {
  let parsedVoterData = [];
  let finishedParsing = false;
  // Uses fast-csv to parse the CSV data into an Object.
  fastCsv
    .parseString(csvData, { headers: true })
    .on('data', (row) => {
      parsedVoterData.push(row);
    })
    .on('end', () => {
      console.log('finished parsing voterData');
      finishedParsing = true;
    });

  // wait up to 30 seconds for the parsing to finish.
  for (let i = 0; i < 60; i++) {
    console.log('parsing voterData...');
    await sleep(500);
    if (finishedParsing === true) {
      break;
    }
  }
  return parsedVoterData;
}

async function getVoterData(
  electionState,
  l2ColumnName,
  l2ColumnValue,
  additionalFilters,
  campaign,
  limitApproved,
) {
  try {
    const searchUrl = `https://api.l2datamapping.com/api/v2/records/search/1OSR/VM_${electionState}?id=1OSR&apikey=${l2ApiKey}`;

    const filters = createFilters(
      l2ColumnName,
      l2ColumnValue,
      additionalFilters,
    );

    if (isFilterEmpty(filters)) {
      return;
    }

    const totalRecords = await getTotalRecords(searchUrl, filters);
    await sails.helpers.slack.errorLoggerHelper('got total records', {
      totalRecords,
    });
    if (!canProceedWithSearch(totalRecords, limitApproved, campaign)) {
      await sails.helpers.slack.errorLoggerHelper('cant proceed with search', {
        totalRecords,
      });
      return;
    }

    const job = await initiateSearch(searchUrl, filters);
    return await waitForSearchCompletion(job, campaign);
  } catch (e) {
    await sails.helpers.slack.errorLoggerHelper('error at getVoterData', e);
    return;
  }
}

function createFilters(l2ColumnName, l2ColumnValue, additionalFilters) {
  let filters = {};
  if (l2ColumnName && l2ColumnValue) {
    filters[l2ColumnName] = l2ColumnValue;
  }
  if (additionalFilters) {
    filters = { ...filters, ...additionalFilters };
  }
  return filters;
}

function isFilterEmpty(filters) {
  return !filters || Object.keys(filters).length === 0;
}

async function getTotalRecords(searchUrl, filters) {
  try {
    let estimateResponse;
    try {
      estimateResponse = await axios.post(searchUrl, {
        format: 'counts',
        filters,
        columns: ['Parties_Description'],
      });
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'error searching for voter data. getTotalRecords estimateResponse',
        { e, filters, searchUrl },
      );
      console.log('error at getVoterData estimateResponse', e);
    }

    await sails.helpers.slack.errorLoggerHelper('estimateResponse?.data', {
      estimateResponseData: estimateResponse?.data,
    });

    let totalRecords = 0;
    if (estimateResponse?.data && isArray(estimateResponse.data)) {
      totalRecords = estimateResponse.data.reduce(
        (acc, item) => acc + (item?.__COUNT || 0),
        0,
      );
    } else {
      await sails.helpers.slack.errorLoggerHelper(
        'unexpected response in getVoterData estimate',
        estimateResponse,
      );
    }
    return totalRecords;
  } catch (e) {
    console.log('error at getVoterData estimate', e);
    await sails.helpers.slack.errorLoggerHelper(
      'error at getVoterData estimate',
      e,
    );
    return 0;
  }
}

async function canProceedWithSearch(totalRecords, limitApproved, campaign) {
  if (totalRecords > maxRecords && !limitApproved) {
    console.log(
      `Voter data estimate is over 100,000 records. Estimate: ${totalRecords}`,
    );
    await sendSlackNotification(
      'Voter Data',
      `Voter data estimate is over 100,000 records. Estimate: ${totalRecords}. Campaign: ${campaign.slug}. Approval is required.`,
      'victory',
    );
    return false;
  }
  return true;
}

async function initiateSearch(searchUrl, filters) {
  try {
    const response = await axios.post(searchUrl, { filters, wait: 0 });
    return response?.data?.job;
  } catch (e) {
    console.log('error at getVoterData search', e);
    return;
  }
}

async function waitForSearchCompletion(job, campaign) {
  let attempts = 0;
  const jobUrl = `https://api.l2datamapping.com/api/v2/records/search/status/${job}?id=1OSR&apikey=${l2ApiKey}`;

  while (true) {
    await sleep(10000);
    try {
      const response = await axios.get(jobUrl);
      const status = response?.data?.status;

      if (status === 'FINISHED') {
        return await downloadFile(job);
      } else if (status === 'ERROR') {
        await sendSlackNotification(
          'Voter Data',
          `Error getting voter data. Job id: ${job}. Campaign: ${campaign.slug}.`,
          'victory',
        );
        break;
      }

      if (++attempts > 180) {
        await sendSlackNotification(
          'Voter Data',
          `Failed to get voter data. Job timed out. Job id: ${job}. Campaign: ${campaign.slug}.`,
          'victory',
        );
        break;
      }
    } catch (e) {
      console.log('error at getVoterData', e);
    }
  }
  return null;
}

async function downloadFile(job) {
  const fileUrl = `https://api.l2datamapping.com/api/v2/records/search/file/${job}?id=1OSR&apikey=${l2ApiKey}`;
  try {
    const response = await axios.get(fileUrl);
    return response?.data;
  } catch (e) {
    console.log('error at getVoterData downloadFile', e);
    return;
  }
}

async function sendSlackNotification(title, message, channel) {
  await sails.helpers.slack.slackHelper(
    simpleSlackMessage(title, message),
    channel,
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simpleSlackMessage(text, body) {
  return {
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: body,
        },
      },
    ],
  };
}
