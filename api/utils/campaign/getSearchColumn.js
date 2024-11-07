const axios = require('axios');
const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

const getChatToolCompletion = require('../ai/getChatToolCompletion');

async function getSearchColumn(
  slug,
  searchColumn,
  electionState,
  searchString,
  searchString2 = '',
) {
  let foundColumn;
  //   sails.helpers.log(slug, 'searchColumns', searchColumns);
  //   sails.helpers.log(slug, 'searchString', searchString);
  //   sails.helpers.log(slug, 'searchString2', searchString2);
  try {
    let search = searchString;
    if (searchString2) {
      search = `${searchString} ${searchString2}`;
    }
    sails.helpers.log(slug, `searching for ${search}`);
    let searchValues = await querySearchColumn(
      slug,
      searchColumn,
      electionState,
    );
    // strip out any searchValues that are a blank string ""
    searchValues = searchValues.filter((value) => value !== '');
    sails.helpers.log(
      slug,
      `found ${searchValues.length} searchValues for ${searchColumn}`,
    );
    if (searchValues.length > 0) {
      // sails.helpers.log(
      //   slug,
      //   `There are searchValues for ${searchColumn}`,
      //   searchValues,
      // );
      sails.helpers.log(slug, `Using AI to find the best match ...`);
      const match = await matchSearchValues(
        slug,
        searchValues.join('\n'),
        search,
      );
      sails.helpers.log(slug, 'match', match);
      if (
        match &&
        match !== '' &&
        match !== `${electionState}##` &&
        match !== `${electionState}####`
      ) {
        foundColumn = {
          column: searchColumn,
          value: match.replaceAll('"', ''),
        };
      }
    }

    sails.helpers.log(slug, 'getSearchColumn foundColumn', foundColumn);
  } catch (error) {
    sails.helpers.log(slug, 'Error in getSearchColumn', error);
    return undefined;
  }

  return foundColumn;
}

async function matchSearchValues(slug, searchValues, searchString) {
  const functionDefinition = {
    type: 'function',
    function: {
      name: 'matchLabels',
      description: 'Determine the label that closely matches the input.',
      parameters: {
        type: 'object',
        properties: {
          matchedLabel: {
            type: 'string',
            description: 'The label that closely matches the input.',
          },
        },
        required: ['matchedLabel'],
      },
    },
  };

  let toolChoice = {
    type: 'function',
    function: { name: 'matchLabels' },
  };

  let messages = [
    {
      role: 'system',
      content: `
      You are a helpful political assistant whose job is to find the label that closely matches the input. You will return only the matching label in your response and nothing else. You will return in the JSON format specified. If none of the labels are a good match then you will return an empty string for the matchedLabel. If there is a good match return the entire label in the matchedLabel including any hashtags. 
      Example Input: 'Los Angeles School Board District 15 - Los Angeles - CA'
      Example Labels: 'CERRITOS COMM COLL DIST'\n 'GLENDALE COMM COLL DIST'\n 'LOS ANGELES COMM COLL DIST'
      Example Output:
      {
        matchedLabel: ''
      }
      Example Input: 'San Clemente City Council District 1 - San Clemente- CA'
      Example Labels: 'CA####ALHAMBRA CITY CNCL 1'\n 'CA####BELLFLOWER CITY CNCL 1'\n 'CA####SAN CLEMENTE CITY CNCL 1'\n
      Example Output:
      {
        matchedLabel: 'CA####SAN CLEMENTE CITY CNCL 1'
      }
      Example Input: 'California State Senate District 5 - CA'
      Example Labels: 'CA##04'\n 'CA##05'\n 'CA##06'\n
      Example Output: {
        matchedLabel: 'CA##05'
      }
      Example Input: 'Maine Village Board Chair - Wisconsin'
      Example Labels: 'WI##MARATHON COMM COLL DIST'\n 'WI##MARINETTE COMM COLL DIST'\n 'WI##MARQUETTE COMM COLL DIST'\n
      Example Output:
      {
           'matchedLabel': '',
      }
      `,
    },
    {
      role: 'user',
      content: `Find the label that matches. Input: ${searchString}.\n\nLabels: ${searchValues}. Output:`,
    },
  ];

  // console.log('messages', messages);
  const completion = await getChatToolCompletion(
    messages,
    0.1,
    0.1,
    functionDefinition,
    toolChoice,
  );

  const content = completion?.content;
  const tokens = completion?.tokens;
  console.log('content', content);
  console.log('tokens', tokens);
  if (!tokens || tokens === 0) {
    // ai failed. throw an error here, we catch it in consumer.
    // and re-throw it so we can try again via the SQS queue.
    await sails.helpers.slack.slackHelper(
      {
        title: 'AI Failed',
        body: `Error! ${slug} AI failed to find a match for ${searchString}.`,
      },
      'victory-issues',
    );
    sails.helpers.log(slug, 'No Response from AI! For', searchValues);
  }

  if (content && content !== '') {
    let data;
    try {
      data = JSON.parse(content);
    } catch (error) {
      console.log('error', error);
    }
    if (data && data?.matchedLabel && data.matchedLabel !== '') {
      return data.matchedLabel.replace(/"/g, '');
    }
  }
  return undefined;
}

async function querySearchColumn(slug, searchColumn, electionState) {
  let searchValues = [];
  try {
    let searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/column/values/1OSR/VM_${electionState}/${searchColumn}?id=1OSR&apikey=${l2ApiKey}`;
    const response = await axios.get(searchUrl);
    if (response?.data?.values && response.data.values.length > 0) {
      searchValues = response.data.values;
    } else if (
      response?.data?.message &&
      response.data.message.includes('API threshold reached')
    ) {
      console.log('L2-Data API threshold reached');
      await sails.helpers.slack.slackHelper(
        {
          title: 'L2-Data API threshold reached',
          body: `Error! L2-Data API threshold reached for ${searchColumn} in ${electionState}.`,
        },
        'dev',
      );
    }
  } catch (e) {
    sails.helpers.log(slug, 'error at querySearchColumn', e);
  }
  return searchValues;
}

module.exports = getSearchColumn;
