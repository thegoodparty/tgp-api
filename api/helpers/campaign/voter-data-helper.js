const axios = require('axios');
const fastCsv = require('fast-csv');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

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
    badRequest: {
      description: 'Error',
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

      const campaign = await Campaign.findOne({ id: campaignId });

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
        voterData = await parseVoterData(csvData);
      }

      let voterObjs = [];
      for (const voter of voterData) {
        let voterObj = {};
        voterObj.voterId = voter.LALVOTERID;
        voterObj.data = voter;
        voterObj.address = voter.Residence_Addresses_AddressLine;
        voterObj.party = voter.Parties_Description;
        voterObj.state = voter.Residence_Addresses_State;
        voterObj.city = voter.Residence_Addresses_City;
        voterObj.zip = voter.Residence_Addresses_Zip;

        // TODO: calculate these using google api.
        voterObj.lat = '';
        voterObj.lng = '';
        voterObj.geoHash = '';
        voterObjs.push(voterObj);
      }
      console.log('Adding voters to db. Total voters:', voterObjs.length);

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
            console.log('error at voter-data-helper', e);
          }
        }

        await sails.helpers.slack.slackHelper(
          simpleSlackMessage(
            'Voter Data',
            `Added ${voterObjs.length} voter records to campaign ${campaign.slug}.`,
          ),
          'victory',
        );
      }

      return exits.success('ok');
    } catch (e) {
      console.log('error at voter-data-helper', e);
      return exits.badRequest('error');
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
    await new Promise((resolve) => setTimeout(resolve, 500));
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
  let searchResponse;
  let searchUrl = `https://api.l2datamapping.com/api/v2/records/search/1OSR/VM_${electionState}?id=1OSR&apikey=${l2ApiKey}`;

  let filters = {};
  if (l2ColumnName && l2ColumnValue) {
    filters[l2ColumnName] = l2ColumnValue;
  }
  if (additionalFilters) {
    filters = { ...filters, ...additionalFilters };
  }
  if (!filters || Object.keys(filters).length === 0) {
    // dont allow empty filters search to prevent pulling all records.
    return searchResponse;
  }

  let estimateResponse;
  try {
    estimateResponse = await axios.post(searchUrl, {
      format: 'counts',
      filters,
      columns: ['Parties_Description'],
    });
  } catch (e) {
    console.log('error at getVoterData estimate', e);
  }

  let totalRecords = 0;
  if (estimateResponse?.data && estimateResponse.data.length > 0) {
    for (const item of estimateResponse.data) {
      if (item?.__COUNT) {
        totalRecords += item.__COUNT;
      }
    }
  }

  if (totalRecords > 100000 && limitApproved === false) {
    // if the estimate is over 100,000 records, then we don't want to pull it unless its approved.
    await sails.helpers.slack.slackHelper(
      simpleSlackMessage(
        'Voter Data',
        `Voter data estimate is over 100,000 records. Estimate: ${totalRecords}. Campaign: ${campaign.slug}. Approval is required.`,
      ),
      'victory',
    );
    return searchResponse;
  }

  let response;
  try {
    response = await axios.post(searchUrl, {
      filters,
      wait: 0, // allow us to get a job to track the status of the search.
    });
  } catch (e) {
    console.log('error at getVoterData search', e);
  }

  let job;
  if (response?.data) {
    job = response.data.job;
  }
  if (!job) {
    return searchResponse;
  }

  let attempts = 0;
  let jobUrl = `https://api.l2datamapping.com/api/v2/records/search/status/${job}?id=1OSR&apikey=${l2ApiKey}`;
  while (true) {
    try {
      response = await axios.get(jobUrl);
    } catch (e) {
      console.log('error at getVoterData', e);
    }
    let status;
    if (response?.data) {
      status = response.data.status;
    }
    if (status === 'FINISHED') {
      let fileUrl = `https://api.l2datamapping.com/api/v2/records/search/file/${job}?id=1OSR&apikey=${l2ApiKey}`;
      try {
        response = await axios.get(fileUrl);
      } catch (e) {
        console.log('error at getVoterData', e);
      }
      let file;
      // if the download fails it will try again.
      if (response?.data) {
        file = response.data;
        return file;
      }
    } else if (status === 'ERROR') {
      // send slack message
      await sails.helpers.slack.slackHelper(
        simpleSlackMessage(
          'Voter Data',
          `Error getting voter data. Job id: ${job}. Campaign: ${campaign.slug}.`,
        ),
        'victory',
      );
      break;
    }
    // sleep for 10 seconds
    console.log(
      'sleeping for 10 seconds. waiting for job to complete. job id: ',
      job,
    );
    await new Promise((resolve) => setTimeout(resolve, 10000));
    attempts++;
    // give up after 30 minutes.
    if (attempts > 180) {
      await sails.helpers.slack.slackHelper(
        simpleSlackMessage(
          'Voter Data',
          `Failed to get voter data. Job timed out. Job id: ${job}. Campaign: ${campaign.slug}.`,
        ),
        'victory',
      );
      break;
    }
  }

  return searchResponse;
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
