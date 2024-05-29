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

      let index = 0;
      if (countOnly) {
        const count = await countVoters(
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

      console.log('not implemented yet');
      return exits.success('not implemented yet');

      const stream = await countVoters(
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

async function countVoters(
  electionState,
  l2ColumnName,
  l2ColumnValue,
  additionalFilters,
) {
  try {
    // filter to sql query
    // L2 Election Type: County_Commissioner_District - column
    // L2 Location: IN##CLARK##CLARK CNTY COMM DIST 1 value
    const whereClause = filtersToQuery(
      l2ColumnName,
      l2ColumnValue,
      additionalFilters,
    );

    const totalRecords = await getTotalRecords(whereClause, electionState);
    console.log('totalRecords', totalRecords);
    return totalRecords;
  } catch (e) {
    console.log('error at getVoterData', e);
    await sails.helpers.slack.errorLoggerHelper('error at getVoterData', e);
    return;
  }
}

function filtersToQuery(l2ColumnName, l2ColumnValue, filters) {
  let query = '';
  // value is like "IN##CLARK##CLARK CNTY COMM DIST 1" we need just CLARK CNTY COMM DIST 1
  if (l2ColumnName && l2ColumnValue) {
    let cleanValue = l2ColumnValue.split('##').pop();
    query += `"${l2ColumnName}" = '${cleanValue}' `;
  }

  console.log('filters', filters);

  if (filters) {
    if (query !== '') {
      query += ' AND ';
    }
    // party_description
    if (filters.Parties_Description && filters.Parties_Description.length > 0) {
      query += ' "Parties_Description" IN ( ';
      filters.Parties_Description.forEach((party, index) => {
        query += `'${party}'`;
        if (index < filters.Parties_Description.length - 1) {
          query += ', ';
        }
      });
      query += ' ) ';
    }

    // VotingPerformanceEvenYearGeneral
    if (
      filters.VotingPerformanceEvenYearGeneral &&
      filters.VotingPerformanceEvenYearGeneral.length > 0
    ) {
      query += ' AND  "Voters_VotingPerformanceEvenYearGeneral" IN ( ';
      filters.VotingPerformanceEvenYearGeneral.forEach((vote, index) => {
        query += `'${vote}'`;
        if (index < filters.VotingPerformanceEvenYearGeneral.length - 1) {
          query += ', ';
        }
      });
      query += ' ) ';
    }
  }
  if (query.endsWith('AND ')) {
    query = query.slice(0, -4);
  }
  console.log('query', query);
  return query;
}

async function getTotalRecords(whereClause, state) {
  try {
    const query = ` SELECT COUNT(*) FROM public."Voter${state}" WHERE ${whereClause}`;
    const result = await sails.helpers.voter.queryHelper(query);
    return result.rows[0].count;
  } catch (e) {
    console.log('error at getVoterData estimate', e);
    await sails.helpers.slack.errorLoggerHelper(
      'error at getVoterData estimate',
      e,
    );
    return 0;
  }
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
