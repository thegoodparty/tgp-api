const getChatToolCompletion = require('../../../utils/ai/getChatToolCompletion');

module.exports = {
  friendlyName: 'Test ai',

  description: 'Test ai function calling',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const columns = [
      'City_Council_Commissioner_District',
      'City_Mayoral_District',
      'Election_Commissioner_District',
      'Proposed_City_Commissioner_District',
      'State_Senate_District',
      'State_House_District',
      'US_Congressional_District',
      'City_School_District',
      'College_Board_District',
      'Community_College',
      'Community_College_Commissioner_District',
      'Community_College_SubDistrict',
      'County_Board_of_Education_District',
      'County_Board_of_Education_SubDistrict',
      'County_Community_College_District',
      'County_Legislative_District',
      'County_Superintendent_of_Schools_District',
      'County_Unified_School_District',
      'Board_of_Education_District',
      'Board_of_Education_SubDistrict',
      'Education_Commission_District',
      'Educational_Service_District',
      'Elementary_School_District',
      'Elementary_School_SubDistrict',
      'Exempted_Village_School_District',
      'High_School_District',
      'High_School_SubDistrict',
      'Middle_School_District',
      'Proposed_Elementary_School_District',
      'Proposed_Unified_School_District',
      'Regional_Office_of_Education_District',
      'School_Board_District',
      'School_District',
      'School_District_Vocational',
      'School_Facilities_Improvement_District',
      'School_Subdistrict',
      'Service_Area_District',
      'Superintendent_of_Schools_District',
      'Unified_School_District',
      'Unified_School_SubDistrict',
      'District_Attorney',
      'Judicial_Appellate_District',
      'Judicial_Circuit_Court_District',
      'Judicial_County_Board_of_Review_District',
      'Judicial_County_Court_District',
      'Judicial_District',
      'Judicial_District_Court_District',
      'Judicial_Family_Court_District',
      'Judicial_Jury_District',
      'Judicial_Juvenile_Court_District',
      'Judicial_Sub_Circuit_District',
      'Judicial_Superior_Court_District',
      'Judicial_Supreme_Court_District',
      'Municipal_Court_District',
      'Judicial_Magistrate_Division',
    ];

    const searchString = 'Flagstaff Unified School District 3';
    const matchedColumns = await matchSearchColumns(columns, searchString);

    return exits.success({
      matchedColumns,
    });
  },
};

async function matchSearchColumns(searchColumns, searchString) {
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

  console.log('completion', completion);
  console.log('content', completion.content);
  const contentJson = JSON.parse(completion.content);
  console.log('contentJson', contentJson);
  console.log('columns', contentJson.columns);

  return contentJson?.columns || [];
}
