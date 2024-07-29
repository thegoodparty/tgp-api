const axios = require('axios');
const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

module.exports = {
  friendlyName: 'Get search column',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
    officeName: {
      type: 'string',
      required: true,
    },
    electionLevel: {
      type: 'string',
      enum: [
        'federal',
        'state',
        'county',
        'city',
        'local',
        'township',
        'regional',
      ],
    },
    electionState: {
      type: 'string',
      required: true,
    },
    electionCounty: {
      type: 'string',
    },
    electionMunicipality: {
      type: 'string',
    },
    subAreaName: {
      type: 'string',
    },
    subAreaValue: {
      type: 'string',
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
        slug,
        officeName,
        electionLevel,
        electionState,
        electionCounty,
        electionMunicipality,
        subAreaName,
        subAreaValue,
      } = inputs;

      electionTypes = await getSearchColumn(
        slug,
        searchColumns,
        electionState,
        searchString,
      );

      return exits.success(electionTypes);
    } catch (error) {
      sails.helpers.log(slug, 'Error in office-helper', error);
      return exits.badRequest(error);
    }
  },
};

async function getSearchColumn(
  slug,
  searchColumns,
  electionState,
  searchString,
  searchString2,
) {
  let foundColumns = [];
  //   sails.helpers.log(slug, 'searchColumns', searchColumns);
  //   sails.helpers.log(slug, 'searchString', searchString);
  //   sails.helpers.log(slug, 'searchString2', searchString2);
  let search = searchString;
  if (searchString2) {
    search = `${searchString} ${searchString2}`;
  }
  sails.helpers.log(
    slug,
    `searching for ${search} in ${searchColumns.length} columns`,
  );
  for (const searchColumn of searchColumns) {
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
        foundColumns.push({
          column: searchColumn,
          value: match.replaceAll('"', ''),
        });
      }

      // Special case for "At Large" positions.
      if (foundColumns.length === 0 && searchString.includes('At Large')) {
        foundColumns.push({ column: searchColumn, value: searchValues[0] });
      }
    }
  }

  sails.helpers.log(slug, 'office helper foundColumns', foundColumns);

  return foundColumns;
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

  const completion = await sails.helpers.ai.createCompletion(
    messages,
    100,
    0.1,
    0.1,
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
    throw new Error('no response from AI');
  }

  if (content && content !== '') {
    return content.replace(/"/g, '');
  }
}
