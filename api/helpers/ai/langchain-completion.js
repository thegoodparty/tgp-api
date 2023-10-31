const { Pinecone } = require('@pinecone-database/pinecone');
const { VectorDBQAChain } = require('langchain/chains');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { OpenAI } = require('langchain/llms/openai');
const { PineconeStore } = require('langchain/vectorstores/pinecone');
const { Document } = require('langchain/document');
const { PGVectorStore } = require('langchain/vectorstores/pgvector');
const { PoolConfig } = require('pg');

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

      let response = '';

      const config = {
        postgresConnectionOptions: {
          type: 'postgres',
          host: '127.0.0.1',
          port: 5432,
          user: 'postgres',
          password: 'xxxx',
          database: 'tgp-local',
        },
        tableName: 'embeddings',
        columns: {
          idColumnName: 'id',
          vectorColumnName: 'vector',
          contentColumnName: 'content',
          metadataColumnName: 'metadata',
        },
      };

      // todo: truncate the table if it exists.

      process.env.OPENAI_API_KEY =
        sails.config.custom.openAi || sails.config.openAi;

      const pgvectorStore = await PGVectorStore.initialize(
        new OpenAIEmbeddings(),
        config,
      );

      /* Search the vector DB independently with meta filters */
      // const results = await pgvectorStore.similaritySearch('water', 1, {
      //   foo: 'bar',
      // });
      // console.log(results);

      /* Use as part of a chain (currently no metadata filters) */
      const model = new OpenAI({
        engine: 'gpt-3.5-turbo-16k',
        // temperature: temperature || 0.9,
        // topP: 1,
      });
      const chain = VectorDBQAChain.fromLLM(model, pgvectorStore, {
        k: 3, // number of sourceDocuments to include with the prompt.
        returnSourceDocuments: true,
      });
      response = await chain.call({
        query: prompt,
      });

      console.log('response', response);
      return exits.success(response);
    } catch (error) {
      console.log('Error in helpers/ai/langchain-compilation', error);
    }
    return exits.success('');
  },
};
