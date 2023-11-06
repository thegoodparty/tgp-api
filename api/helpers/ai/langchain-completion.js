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
const parse = require('pg-connection-string').parse;

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

  // exits: {
  //   success: {
  //     description: 'Campaign Found',
  //     responseType: 'ok',
  //   },
  // },

  fn: async function (inputs, exits) {
    try {
      const { prompt, campaign, temperature } = inputs;

      // cleanPrompt = await sails.helpers.ai.promptReplace(prompt, campaign);
      // console.log('prompt', prompt);
      let response = '';
      var pgOptions = parse(sails.config.datastores.default.url);

      const config = {
        postgresConnectionOptions: {
          type: 'postgres',
          host: pgOptions.host,
          port: pgOptions.port,
          user: pgOptions.user,
          password: pgOptions.password,
          database: pgOptions.database,
        },
        tableName: 'embeddings',
        columns: {
          idColumnName: 'id',
          vectorColumnName: 'vector',
          contentColumnName: 'content',
          metadataColumnName: 'metadata',
        },
      };

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
        maxTokens: 2000,
        temperature: temperature || 1.0,
        topP: 1.0,
        presencePenalty: 0.0,
        frequencyPenalty: 0.0,
      });
      const chain = VectorDBQAChain.fromLLM(model, pgvectorStore, {
        k: 2, // number of sourceDocuments to include with the prompt.
        returnSourceDocuments: true,
      });
      response = await chain.call({
        query: prompt,
      });

      console.log('response', response);
      let responseText = response?.text;
      console.log('responseText', responseText);
      return exits.success(responseText);
    } catch (error) {
      console.log('Error in helpers/ai/langchain-completion', error);
    }
    return exits.success('');
  },
};
