const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { OpenAI } = require('langchain/llms/openai');
const { Document } = require('langchain/document');
const { DirectoryLoader } = require('langchain/document_loaders/fs/directory');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { PGVectorStore } = require('langchain/vectorstores/pgvector');
const { PoolConfig } = require('pg');

const path = require('path');

function cleanString(text) {
  text = text.replace(/\\/g, '');
  text = text.replace(/#/g, ' ');
  text = text.replace(/\. \./g, '.');
  text = text.replace(/\s\s+/g, ' ');
  text = text.replace(/(\r\n|\n|\r)/gm, ' ');
  // we also remove null characters
  text = text.replace(/\0/g, '');

  return text.trim();
}

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

      // todo: use https://www.npmjs.com/package/pg-connection-string
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

      const embeddingsDirectory = path.resolve('./data/ai');
      console.log('embeddingsDirectory', embeddingsDirectory);

      const directoryLoader = new DirectoryLoader(embeddingsDirectory, {
        '.pdf': (path) => new PDFLoader(path),
        '.txt': (path) => new TextLoader(path),
      });

      console.log('loading directory');
      const docs = await directoryLoader.load();

      for (d = 0; d < docs.length; d++) {
        // console.log('doc', doc);
        docs[d].pageContent = cleanString(docs[d].pageContent);
      }

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2000,
        chunkOverlap: 200,
        separators: ['\n'],
        keepSeparator: false,
      });

      console.log('splitting docs');
      // todo: add metaData to docs? filename? etc.
      const splitDocs = await textSplitter.splitDocuments(docs);

      console.log('adding docs');
      // todo: wrap in try catch.
      await pgvectorStore.addDocuments(splitDocs);

      return exits.success('ok');
    } catch (error) {
      console.log('Error in helpers/ai/langchain-insert', error);
    }
    return exits.success('');
  },
};
