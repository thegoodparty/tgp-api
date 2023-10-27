const path = require('path');
const fs = require('fs');
const {
  LLMApplicationBuilder,
  PdfLoader,
  YoutubeLoader,
  TextLoader,
} = require('@llmembed/embedjs');
const { PineconeDb } = require('@llmembed/embedjs/databases/pinecone');
const { LmdbCache } = require('@llmembed/embedjs/cache/lmdb');

// const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
// const md5 = require('md5');
// const { BaseLoader } = require('@llmembed/embedjs/interfaces/base-loader');
// const { cleanString } = require('@llmembed/embedjs/global/utils.js');

// const { CustomTextLoader } = require('../../services/CustomTextLoader');

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

      const text = fs.readFileSync(
        path.join(__dirname, '../../../data/ai/theoryofchange.txt'),
        'utf8',
      );
      //   console.log('text', text);

      process.env.OPENAI_API_KEY =
        sails.config.custom.openAi || sails.config.openAi;
      process.env.PINECONE_API_KEY =
        sails.config.custom.pineconeKey || sails.config.pineconeKey;
      process.env.PINECONE_ENVIRONMENT =
        sails.config.custom.pineconeEnvironment ||
        sails.config.pineconeEnvironment;
      const cachePath = path.resolve('./cache');
      console.log('cachePath', cachePath);

      const llmApplication = await new LLMApplicationBuilder()
        // .addLoader(
        //   new PdfLoader({ filePath: path.resolve('../paxos-simple.pdf') }),
        // )
        // .addLoader(
        //   new YoutubeLoader({
        //     videoIdOrUrl: 'https://www.youtube.com/watch?v=w2KbwC-s7pY',
        //   }),
        // )
        .addLoader(
          //   new CustomTextLoader({
          //     text: text,
          //   }),
          new TextLoader({
            text: text,
          }),
        )
        .setCache(new LmdbCache({ path: cachePath }))
        .setVectorDb(new PineconeDb({ projectName: 'gpindex' })) //, namespace: 'gcp-starter'
        .build();

      const response = await llmApplication.query(prompt);
      console.log('response', response);
      return exits.success(response);
    } catch (error) {
      console.log('error', error);
      if (error.response.data.error.message) {
        console.log(
          'Error in helpers/ai/embed-compilation',
          error.response.data.error.message,
        );
      }
    }
    return exits.success('');
  },
};
