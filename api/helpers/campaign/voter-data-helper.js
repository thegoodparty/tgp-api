const axios = require('axios');
const fastCsv = require('fast-csv');
const csv = require('csv-parser');
const { max, isArray } = require('lodash');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;
const appBase = sails.config.custom.appBase || sails.config.appBase;
let maxRecords = 100000;
if (appBase !== 'https://goodparty.org') {
  maxRecords = 50000;
}

let maxInserts;
if (appBase === 'http://localhost:4000') {
  maxInserts = 2000;
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
    countOnly: {
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
        countOnly,
      } = inputs;
      await sails.helpers.queue.consumer();

      await sails.helpers.slack.errorLoggerHelper('voter data helper.', inputs);

      let campaign;
      try {
        campaign = await Campaign.findOne({ id: campaignId });
      } catch (e) {
        console.log('error finding campaign in voter-data-helper', e);
        return exits.success('error');
      }

      console.log(`voterDataHelper invoked with ${JSON.stringify(inputs)}`);
      // first remove all previous voters
      await Campaign.replaceCollection(campaignId, 'voters').members([]);

      let index = 0;
      if (countOnly) {
        const count = await getVoterData(
          electionState,
          l2ColumnName,
          l2ColumnValue,
          additionalFilters,
          campaign,
          limitApproved,
          countOnly,
        );
        return exits.success(count);
      }

      const stream = await getVoterData(
        electionState,
        l2ColumnName,
        l2ColumnValue,
        additionalFilters,
        campaign,
        limitApproved,
      );
      stream
        .pipe(csv())
        .on('data', async (row) => {
          stream.pause();
          try {
            index++;
            if (maxInserts && index >= maxInserts) {
              console.log('skipping', index, maxInserts);
              return;
            }
            await handleCsvRow(row, campaignId);
          } catch (e) {
            console.error('Failed to process row', e);
          }
          stream.resume();
        })
        .on('end', async () => {
          console.log('updating campaign data to completed');
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

          const queueMessage = {
            type: 'calculateGeoLocation',
            data: {},
          };

          console.log('adding new voterIds to queue. message: ', queueMessage);
          await sails.helpers.queue.enqueue(queueMessage);
          return exits.success('ok');
        })
        .on('error', async (e) => {
          console.log('Error reading csv', e);
          const updated = await Campaign.findOne({ id: campaignId });
          const updateData = updated.data;
          delete updateData.hasVoterFile;
          await Campaign.updateOne({ id: campaignId }).set({
            data: updateData,
          });
          return exits.success('error');
        });
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

async function handleCsvRow(row, campaignId) {
  const voterObj = await parseVoter(row);
  await insertVoterToDb(voterObj, campaignId);
}

async function parseVoter(voter) {
  const voterObj = {};
  voterObj.voterId = voter.LALVOTERID;
  voterObj.address = voter.Residence_Addresses_AddressLine;
  voterObj.party = voter.Parties_Description;
  voterObj.state = voter.Residence_Addresses_State;
  voterObj.city = voter.Residence_Addresses_City;
  voterObj.zip = voter.Residence_Addresses_Zip;

  // const address = `${voterObj.address} ${voterObj.city}, ${voterObj.state} ${voterObj.zip}`;
  // const loc = await sails.helpers.geocoding.geocodeAddress(address);
  // const { lat, lng, full, geoHash } = loc;
  voterObj.data = voter;

  return voterObj;
}

// TODO: convert this to batch insert
async function insertVoterToDb(voterObj, campaignId) {
  let newVoter;
  try {
    const existing = await Voter.findOne({
      voterId: voterObj.voterId,
    });
    if (existing) {
      await Campaign.addToCollection(campaignId, 'voters', existing.id);
    } else {
      console.log('new voter');
      voterObj.pendingProcessing = true;
      newVoter = await Voter.create(voterObj).fetch();
      await Campaign.addToCollection(campaignId, 'voters', newVoter.id);
    }
  } catch (e) {
    console.log('Error adding voter to DB', e);
    await sails.helpers.slack.errorLoggerHelper(
      'Error adding voter to DB',
      e,
      voterObj,
    );
  }

  return false;
}

async function getVoterData(
  electionState,
  l2ColumnName,
  l2ColumnValue,
  additionalFilters,
  campaign,
  limitApproved,
  countOnly,
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
    if (countOnly) {
      return totalRecords;
    }
    if (!canProceedWithSearch(totalRecords, limitApproved, campaign)) {
      await sails.helpers.slack.errorLoggerHelper('cant proceed with search', {
        totalRecords,
      });
      return;
    }

    const job = await initiateSearch(searchUrl, filters);
    return await waitForSearchCompletion(job, campaign);
  } catch (e) {
    console.log('error at getVoterData', e);
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
        return await streamFile(job);
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

async function streamFile(job) {
  const fileUrl = `https://api.l2datamapping.com/api/v2/records/search/file/${job}?id=1OSR&apikey=${l2ApiKey}`;
  try {
    const response = await axios.get(fileUrl, { responseType: 'stream' });
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
