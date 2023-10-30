const { Pinecone } = require('@pinecone-database/pinecone');
const { VectorDBQAChain } = require('langchain/chains');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { OpenAI } = require('langchain/llms/openai');
const { PineconeStore } = require('langchain/vectorstores/pinecone');
const { Document } = require('langchain/document');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

const path = require('path');
const fs = require('fs');

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Embedding Inserted',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      //   const { prompt, campaign, temperature } = inputs;

      const filename = path.join(
        __dirname,
        '../../../data/ai/theoryofchange.txt',
      );

      const text = fs.readFileSync(filename, 'utf8');
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

      const indexes = await pinecone.listIndexes();
      console.log('indexes', indexes);
      for (let i = 0; i < indexes.length; i++) {
        const index = indexes[i];
        if (index.name === 'gpindex') {
          // delete the index if it already exists.
          await pinecone.deleteIndex('gpindex');
        }
      }

      await pinecone.createIndex({
        name: 'gpindex',
        dimension: 1536, // ada-002 embeddings model dimensions size
        metric: 'cosine', // cosine, dotproduct, euclidean
      });

      const pineconeIndex = pinecone.Index('gpindex');

      console.log('pineconeIndex', pineconeIndex);

      //   let response = '';

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1536,
        chunkOverlap: 0,
        keepSeparator: false,
        separators: ['\n', '\n\n'],
      });
      const chunks = await textSplitter.splitText(text);

      let docs = [];
      chunks.map((chunk, index) => {
        const doc = new Document({
          pageContent: chunk,
          metadata: {
            name: filename,
          },
        });
        console.log('doc', doc);
        docs.push(doc);
      });

      // insert into index
      const insertResponse = await PineconeStore.fromDocuments(
        docs,
        new OpenAIEmbeddings(),
        {
          pineconeIndex,
          maxConcurrency: 5, // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
        },
      );

      console.log('insertResponse', insertResponse);

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
