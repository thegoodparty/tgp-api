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
    } catch (e) {
      console.log('error at count-voter-data', e);
      await sails.helpers.slack.errorLoggerHelper(
        'error at count-voter-data.',
        e,
      );
      return exits.success('error');
    }
  },
};

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
