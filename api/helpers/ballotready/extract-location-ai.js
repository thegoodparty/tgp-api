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

      if (level === 'local' || level === 'regional') {
        // if the level is local or regional, we need to refine the level
        if (office.includes('Village')) {
          level = 'village';
        } else if (office.includes('Township')) {
          level = 'township';
        } else if (office.includes('Town')) {
          level = 'town';
        } else if (
          office.includes('City') ||
          office.includes('Municipal') ||
          office.includes('Borough')
        ) {
          level = 'city';
        } else if (office.includes('County') || office.includes('Parish')) {
          level = 'county';
        }
      }

      let countyPrompt = `
      You are a helpful political assistant whose job is to extract a county from an office name. You will return a json in your response and nothing else. You must use your knowledge of where the Office is located to answer the question instead of regurgitating a string from the input. 
      Example Input: "Los Angeles School Board District 15 - CA"
      Example Output:
      {
           "county": "Los Angeles"
      }
      Example Input: "Sonoma County USD Education Board - CA"
      Example Output: 
      {
           "county": "Sonoma"
      }
      Example Input: "US Senate - CA"
      Example Output: {
      }
      Example Input: "Pretty Water Elementary School Board - OK"
      Example Output:
      {
           "county": "Creek County"
      }        
      `;
      let cityPrompt = `You are a helpful political assistant whose job is to extract a city from an office name. You will return a json in your response and nothing else. You must use your knowledge of where the Office is located to answer the question instead of regurgitating a string from the input. 
      Example Input: "Los Angeles School Board District 15 - CA"
      Example Output:
      {
           "city": "Los Angeles",
           "county": "Los Angeles"
      }
      Example Input: "San Clemente Education Board - CA"
      Example Output: 
      {
           "city": "San Clemente",
           "county": "Orange County"
      }
      Example Input: "US Senate - CA"
      Example Output: {
      }
      Example Input: "Pretty Water Elementary School Board - OK"
      Example Output:
      {
           "city": "Sapulpa",
           "county": "Creek County"
      }
      `;
      let townPrompt = `You are a helpful political assistant whose job is to extract a Town from an office name. You will return a json in your response and nothing else. You must use your knowledge of where the Office is located to answer the question instead of regurgitating a string from the input.
      Example Input: "Los Angeles School Board District 15 - CA"
      Example Output:
      {
      }
      Example Input: "Elkin Town Council - NC"
      Example Output:
      {
           "town": "Elkin Town",
           "county": "Surry County"
      }
      Example Input: "US Senate - CA"
      Example Output: {
      }
      Example Input: "Erath Town Mayor - LA"
      Example Output:
      {
           "town": "Erath Town",
           "county": "Vermilion Parish"
      }
      `;
      let townshipPrompt = `You are a helpful political assistant whose job is to extract a Township from an office name. You will return a json in your response and nothing else. You must use your knowledge of where the Office is located to answer the question instead of regurgitating a string from the input.
      Example Input: "Los Angeles School Board District 15 - CA"
      Example Output:
      {
      }
      Example Input: "Bloomfield Township Trustee - MI"
      Example Output:
      {
           "township": "Bloomfield Township",
           "county": "Oakland County"
      }
      Example Input: "US Senate - CA"
      Example Output: {
      }
      Example Input: "Burlington Township Mayor - NJ"
      Example Output:
      {
           "township": "Burlington Township",
           "county": "Burlington County"
      }
      `;
      let villagePrompt = `You are a helpful political assistant whose job is to extract a Village from an office name. You will return a json in your response and nothing else. You must use your knowledge of where the Office is located to answer the question instead of regurgitating a string from the input.
      Example Input: "Los Angeles School Board District 15 - CA"
      Example Output:
      {
      }
      Example Input: "Pawling Village Mayor - New York"
      Example Output:
      {
            "village": "Pawling Village",
            "county": "Dutchess County"
      }
      Example Input: "US Senate - CA"
      Example Output: {
      }
      Example Input: "Maine Village Board Chair - Wisconsin"
      Example Output:
      {
           "village": "Maine Village",
           "county": "Marathon County"
      }
      `;

      let systemPrompt;
      if (level === 'county') {
        systemPrompt = countyPrompt;
      } else if (level === 'city') {
        systemPrompt = cityPrompt;
      } else if (level === 'town') {
        systemPrompt = townPrompt;
      } else if (level === 'township') {
        systemPrompt = townshipPrompt;
      } else if (level === 'village') {
        systemPrompt = villagePrompt;
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
        decodedContent.level = level;
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
