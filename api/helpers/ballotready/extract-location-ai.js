/* eslint-disable object-shorthand */
const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    office: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { office } = inputs;

      let messages = [
        {
          role: 'system',
          content: `
          you are a helpful political assistant whose job is to extract a city or county from an office name. You will return a json in your response and nothing else.
          Example Input: "Los Angeles School Board District 15"
          Example Output:
          {
               "city": "Los Angeles"
          }
          Example Input: "Sonoma County USD Education Board"
          Example Output: 
          {
               "county": "Sonoma"
          }
          Example Input: "US Senate - California"
          Example Output: {
          }          
          `,
        },
        {
          role: 'user',
          content: `Input: "${office}"
          Output:`,
        },
      ];

      const completion = await sails.helpers.ai.createCompletion(
        messages,
        100,
        0.1,
        0.1,
      );

      const content = completion.content;
      let decodedContent = {};
      try {
        decodedContent = JSON.parse(content);
      } catch (e) {
        console.log('error at extract-location-ai helper', e);
      }
      return exits.success(decodedContent);
    } catch (e) {
      console.log('error at extract-location-ai helper', e);
      return exits.success(false);
    }
  },
};
