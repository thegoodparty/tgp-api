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
    searchColumns = await findMiscDistricts(
      slug,
      officeName,
      electionState,
      electionLevel,
    );

    sails.helpers.log(slug, 'miscDistricts', searchColumns);
    return searchColumns;
  } catch (error) {
    sails.helpers.log(slug, 'error', error);
  }
  return searchColumns;
}

function getOfficeCategory(officeName, electionLevel) {
  let category;

  let searchMap = {
    Judicial: ['Judicial', 'Judge', 'Attorney', 'Court', 'Justice'],
    Education: ['Education', 'School', 'College', 'University', 'Elementary'],
    City: [
      'City Council',
      'City Mayor',
      'City Clerk',
      'City Treasurer',
      'City Commission',
    ],
    County: [
      'County Commission',
      'County Supervisor',
      'County Legislative',
      'County Board',
    ],
    State: [
      'U.S. Congress',
      'U.S. Senate',
      'U.S. House',
      'U.S. Representative',
      'U.S. Senator',
      'Senate',
      'State House',
      'House of Representatives',
      'State Assembly',
      'State Representative',
      'State Senator',
    ],
  };

  for (const [key, value] of Object.entries(searchMap)) {
    for (const search of value) {
      if (officeName.toLowerCase().includes(search.toLowerCase())) {
        category = key;
        break;
      }
    }
  }

  if (!category) {
    if (
      electionLevel.toLowerCase() === 'city' ||
      electionLevel.toLowerCase() === 'local'
    ) {
      category = 'City';
    } else if (electionLevel.toLowerCase() === 'county') {
      category = 'County';
    }
  }

  return category;
}

async function findMiscDistricts(slug, officeName, state, electionLevel) {
  // Attempt to determine the category of the office.
  const category = getOfficeCategory(officeName, electionLevel);
  console.log(`Determined category: ${category} for office ${officeName}`);

  // Populate the potential miscellaneous districts from the database.
  let results;
  if (category) {
    results = await ElectionType.find({ state, category });
  } else {
    results = await ElectionType.find({ state });
  }

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
    let contentJson;
    try {
      contentJson = JSON.parse(matchResp.content);
    } catch (e) {
      sails.helpers.log(slug, 'error parsing matchResp', e);
    }
    try {
      let columns = contentJson?.columns || [];
      sails.helpers.log(slug, 'columns', columns);
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
        // the below does not work because the columns is not valid json because its returned with ' and not ".
        // rather than do something hacky like replacing ' with " we have revised the prompt and are investigating issues with function calling parsing.
        // let columnJson = JSON.parse(columns) || [];
        // if (columnJson && Array.isArray(columnJson) && columnJson.length > 0) {
        //   foundMiscDistricts = columnJson;
        //   await sails.helpers.slack.slackHelper(
        //     {
        //       title: 'Error',
        //       body: `Double Json.parse was successful for columns: ${foundMiscDistricts}.`,
        //     },
        //     'dev',
        //   );
        // }
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
  const matchColumnTool = {
    type: 'function',
    function: {
      name: 'match_columns',
      description: 'Determine the columns that best match the office name.',
      parameters: {
        type: 'object',
        properties: {
          columns: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'The list of columns that best match the office name.',
            maxItems: 5,
          },
        },
      },
    },
  };

  let toolChoice = {
    type: 'function',
    function: { name: 'match_columns' },
  };

  // todo: if meta llama keeps messing up the formatting we may need to add some few shot examples to the prompt.
  const completion = await getChatToolCompletion(
    [
      {
        role: 'system',
        content:
          'You are a political assistant whose job is to find the top 5 columns that match the office name (ordered by the most likely at the top). If none of the labels are a good match then you will return an empty column array. Make sure you only return columns that are extremely relevant. For Example: for a City Council position you would not return a State position or a School District position. Please return valid JSON only. Do not return more than 5 columns.',
      },
      {
        role: 'user',
        content: `Find the top 5 columns that matches the following office: "${searchString}.\n\nColumns: ${searchColumns}"`,
      },
    ],
    0.1,
    0.1,
    matchColumnTool,
    toolChoice,
  );

  return completion;
}

module.exports = searchMiscDistricts;
