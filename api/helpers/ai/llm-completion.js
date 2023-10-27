const {
  OpenAI,
  serviceContextFromDefaults,
  OpenAIEmbedding,
  VectorStoreIndex,
  Document,
  SimpleDirectoryReader,
  storageContextFromDefaults,
} = require('llamaindex');
const { encode } = require('gpt-3-encoder');
const fs = require('fs');
const path = require('path');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;

module.exports = {
  inputs: {
    prompt: {
      required: true,
      type: 'string',
    },
    campaign: {
      required: false,
      type: 'json',
    },
    temperature: {
      required: false,
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { prompt, campaign, temperature } = inputs;

      //   cleanPrompt = await sails.helpers.ai.promptReplace(prompt, campaign);
      let cleanPrompt = prompt;

      let model = 'gpt-3.5-turbo';
      let topP = 0.1;
      const tokens = encode(cleanPrompt);
      const encodedLength = tokens.length;
      if (encodedLength > 1000) {
        model += '-16k';
      }

      const llm = new OpenAI({
        apiKey: openAiKey,
        model: model,
      });

      const text = fs.readFileSync(
        path.join(__dirname, '../../../data/ai/theoryofchange.txt'),
        'utf8',
      );
      const document = new Document({
        text: text,
      });

      // const documents = await new SimpleDirectoryReader().loadData(
      //   '/Users/taylor/Documents/Code/Sails/tgp-api/data/ai',
      // );
      // console.log('documents', documents);

      const serviceContext = serviceContextFromDefaults({
        llm: llm,
        embedModel: new OpenAIEmbedding({ apiKey: openAiKey }),
      });

      const storageContext = await storageContextFromDefaults({
        persistDir: '/Users/taylor/Documents/Code/Sails/tgp-api/storage',
      });

      const index = await VectorStoreIndex.fromDocuments([document], {
        serviceContext,
        storageContext,
      });

      // const index = await VectorStoreIndex.fromDocuments(documents, {
      //   serviceContext,
      //   storageContext,
      // });
      const queryEngine = index.asQueryEngine();

      let resp = '';
      const completion = await queryEngine.query(prompt);

      console.log('completion', completion);
      if (completion && completion.response) {
        resp = completion.response.trim();
        console.log('OpenAI Response', resp);
        return exits.success(resp.replace('/n', ''));
      }
    } catch (error) {
      console.log('error', error);
      if (error.response.data.error.message) {
        console.log(
          'Error in helpers/ai/llm-compilation',
          error.response.data.error.message,
        );
      }
    }
    return exits.success('');
  },
};
