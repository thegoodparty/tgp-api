/* eslint-disable object-shorthand */
const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    office: {
      type: 'string',
    },
    level: {
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
      const { office, level } = inputs;

      let countyPrompt = `
      You are a helpful political assistant whose job is to extract a county from an office name. You will return a json in your response and nothing else. You must use your knowledge of where the Office is located to answer the question instead of regurgitating a string from the input. 
      Example Input: "Los Angeles School Board District 15"
      Example Output:
      {
           "county": "Los Angeles"
      }
      Example Input: "Sonoma County USD Education Board"
      Example Output: 
      {
           "county": "Sonoma"
      }
      Example Input: "US Senate - California"
      Example Output: {
      }
      Example Input: "Pretty Water Elementary School Board"
      Example Output:
      {
           "county": "Creek County"
      }        
      `;
      let cityPrompt = `You are a helpful political assistant whose job is to extract a city from an office name. You will return a json in your response and nothing else. You must use your knowledge of where the Office is located to answer the question instead of regurgitating a string from the input. 
      Example Input: "Los Angeles School Board District 15"
      Example Output:
      {
           "city": "Los Angeles"
      }
      Example Input: "San Clemente Education Board"
      Example Output: 
      {
           "city": "San Clemente"
      }
      Example Input: "US Senate - California"
      Example Output: {
      }
      Example Input: "Pretty Water Elementary School Board"
      Example Output:
      {
           "city": "Sapulpa"
      }
      `;

      let systemPrompt;
      if (level === 'county') {
        systemPrompt = countyPrompt;
      } else if (level === 'city') {
        systemPrompt = cityPrompt;
      } else {
        exits.success(false);
      }

      let messages = [
        {
          role: 'system',
          content: systemPrompt,
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
