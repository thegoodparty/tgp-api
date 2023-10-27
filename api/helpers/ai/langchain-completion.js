const { Pinecone } = require('@pinecone-database/pinecone');
const { VectorDBQAChain } = require('langchain/chains');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { OpenAI } = require('langchain/llms/openai');
const { PineconeStore } = require('langchain/vectorstores/pinecone');
const { Document } = require('langchain/document');

const path = require('path');
const fs = require('fs');

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

      const pinecone = new Pinecone();

      const pineconeIndex = pinecone.Index('gpindex');

      // const deleteResp = await pinecone.deleteIndex('gpindex');
      // console.log('deleteResp', deleteResp);

      let response = '';

      // insert into index
      // const docs = [
      //   new Document({
      //     metadata: { name: 'good party theory of change' },
      //     pageContent: text,
      //   }),
      // ];

      // await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
      //   pineconeIndex,
      //   maxConcurrency: 5, // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
      // });

      const vectorStore = await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings(),
        { pineconeIndex },
      );

      /* Search the vector DB independently with meta filters */
      // const results = await vectorStore.similaritySearch('pinecone', 1, {
      //   foo: 'bar',
      // });
      // console.log(results);

      /* Use as part of a chain (currently no metadata filters) */
      const model = new OpenAI();
      const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
        k: 1,
        returnSourceDocuments: true,
      });
      response = await chain.call({ query: 'What is good party?' });

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
