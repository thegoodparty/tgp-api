const axios = require('axios');
const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

const llmChatCompletion = require('../ai/llmChatCompletion');

async function getSearchColumn(
  slug,
  searchColumn,
  electionState,
  searchString,
  searchString2 = '',
) {
  try {
    electionTypes = await findSearchColumn(
      slug,
      searchColumn,
      electionState,
      searchString,
      searchString2,
    );

    return electionTypes;
  } catch (error) {
    sails.helpers.log(slug, 'Error in office-helper', error);
    return undefined;
  }
}

async function findSearchColumn(
  slug,
  searchColumn,
  electionState,
  searchString,
  searchString2,
) {
  let foundColumn;
  //   sails.helpers.log(slug, 'searchColumns', searchColumns);
  //   sails.helpers.log(slug, 'searchString', searchString);
  //   sails.helpers.log(slug, 'searchString2', searchString2);
  let search = searchString;
  if (searchString2) {
    search = `${searchString} ${searchString2}`;
  }
  sails.helpers.log(slug, `searching for ${search}`);
  let searchValues = await querySearchColumn(slug, searchColumn, electionState);
  // strip out any searchValues that are a blank string ""
  searchValues = searchValues.filter((value) => value !== '');
  sails.helpers.log(
    slug,
    `found ${searchValues.length} searchValues for ${searchColumn}`,
  );
  if (searchValues.length > 0) {
    sails.helpers.log(
      slug,
      `There are searchValues for ${searchColumn}`,
      searchValues,
    );
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

  return foundColumn;
}

async function matchSearchValues(slug, searchValues, searchString) {
  let messages = [
    {
      role: 'system',
      content: `
        you are a helpful political assistant whose job is to find the label that most closely matches the input. You will return only the matching label in your response and nothing else. If none of the labels are a good match then you will return "". If there is a good match return the entire label including any hashtags. 
          `,
    },
    {
      role: 'user',
      content: `find the label that matches the following office: "${searchString}.\n\nLabels: ${searchValues}"`,
    },
  ];

  // const completion = await sails.helpers.ai.createCompletion(
  //   messages,
  //   100,
  //   0.1,
  //   0.1,
  // );

  // todo: update this to use function calling and use getChatToolCompletion
  // so that it works better with llama3.1
  // also add some few shot examples including non-matching examples.
  const completion = await llmChatCompletion(messages, 100, 0.1, 0.1);

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
    throw new Error('no response from AI');
  }

  if (content && content !== '') {
    return content.replace(/"/g, '');
  }
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
