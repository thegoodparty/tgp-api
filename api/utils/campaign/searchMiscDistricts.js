const getChatToolCompletion = require('../ai/getChatToolCompletion');

async function searchMiscDistricts(
  slug,
  officeName,
  electionLevel,
  electionState,
) {
  let searchColumns = [];
  try {
    sails.helpers.log(slug, `Searching misc districts for ${officeName}`);
    searchColumns = await findMiscDistricts(slug, officeName, electionState);

    sails.helpers.log(slug, 'miscDistricts', searchColumns);
    return searchColumns;
  } catch (error) {
    sails.helpers.log(slug, 'error', error);
  }
  return searchColumns;
}

async function findMiscDistricts(slug, officeName, state) {
  // Populate the miscellaneous districts from the database.
  const results = await ElectionType.find({ state });

  if (!results || results.length === 0) {
    sails.helpers.log(
      slug,
      `Error! No ElectionType results found for state ${state}. You may need to run seed election-types.`,
    );
    await sails.helpers.slack.slackHelper(
      {
        title: 'Path To Victory',
        body: `Error! ${slug} No ElectionType results found for state ${state}. You may need to run seed election-types.`,
      },
      'victory-issues',
    );
    return [];
  }

  let miscellaneousDistricts = [];
  for (const result of results) {
    if (result?.name && result?.category) {
      miscellaneousDistricts.push(result.name);
    }
  }

  // Use AI to find the best matches for the office name.
  let foundMiscDistricts = [];
  const matchResp = await matchSearchColumns(
    slug,
    miscellaneousDistricts,
    officeName,
  );
  if (matchResp && matchResp?.content) {
    try {
      const contentJson = JSON.parse(matchResp.content);
      sails.helpers.log(slug, 'columns', contentJson.columns);
      let columns = contentJson?.columns || [];
      if (columns && Array.isArray(columns) && columns.length > 0) {
        foundMiscDistricts = columns;
      } else {
        // todo: clean this up after analyzing some slack logs.
        await sails.helpers.slack.slackHelper(
          {
            title: 'Error',
            body: `Received invalid response while finding misc districts for ${officeName}. columns: ${columns}. typeof columns: ${typeof columns}. Raw Content: ${
              matchResp.content
            }`,
          },
          'dev',
        );
        let columnJson = JSON.parse(columns) || [];
        if (columnJson && Array.isArray(columnJson) && columnJson.length > 0) {
          foundMiscDistricts = columnJson;
          await sails.helpers.slack.slackHelper(
            {
              title: 'Error',
              body: `Double Json.parse was successful for columns: ${foundMiscDistricts}.`,
            },
            'dev',
          );
        }
      }
      sails.helpers.log(slug, 'found miscDistricts', matchResp);
    } catch (e) {
      sails.helpers.log(slug, 'error parsing matchResp', e);
    }
  }

  return foundMiscDistricts;
}

async function matchSearchColumns(slug, searchColumns, searchString) {
  sails.helpers.log(
    slug,
    `Doing AI search for ${searchString} against ${searchColumns.length} columns`,
  );
  const functionDefinition = [
    {
      type: 'function',
      function: {
        name: 'matchColumns',
        description: 'Determine the columns that best match the office name.',
        parameters: {
          type: 'object',
          properties: {
            columns: {
              type: 'array',
              items: {
                type: 'string',
              },
              description:
                'The list of columns that best match the office name.',
              maxItems: 5,
            },
          },
          required: ['columns'],
        },
      },
    },
  ];

  let toolChoice = {
    type: 'function',
    function: { name: 'matchColumns' },
  };

  const completion = await getChatToolCompletion(
    [
      {
        role: 'system',
        content:
          'You are a political assistant whose job is to find the top 5 columns that match the office name (ordered by the most likely at the top). If none of the labels are a good match then you will return an empty column array. Make sure you only return columns that are extremely relevant. For Example: for a City Council position you would not return a State position or a School District position.',
      },
      {
        role: 'user',
        content: `Find the top 5 columns that matches the following office: "${searchString}.\n\nColumns: ${searchColumns}"`,
      },
    ],
    0.1,
    0.1,
    functionDefinition,
    toolChoice,
  );

  return completion;
}

module.exports = searchMiscDistricts;
