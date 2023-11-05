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
const fs = require('fs');
const parse = require('pg-connection-string').parse;

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

      // truncate the table
      console.log('truncating embeddings table');
      await sails.sendNativeQuery('TRUNCATE TABLE embeddings;');

      const embeddingsDirectory = path.resolve('./data/ai');

      // download documents from s3 to ./data/ai
      await sails.helpers.s3LoadList(
        'documents.goodparty.org',
        '',
        embeddingsDirectory,
      );

      process.env.OPENAI_API_KEY =
        sails.config.custom.openAi || sails.config.openAi;

      const pgvectorStore = await PGVectorStore.initialize(
        new OpenAIEmbeddings(),
        config,
      );

      const directoryLoader = new DirectoryLoader(embeddingsDirectory, {
        '.pdf': (path) => new PDFLoader(path),
        '.txt': (path) => new TextLoader(path),
      });

      console.log('loading directory', embeddingsDirectory);
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

      console.log('deleting documents from', embeddingsDirectory);
      // delete all files in the embeddings directory
      const files = fs.readdirSync(embeddingsDirectory);
      for (const file of files) {
        fs.unlinkSync(path.join(embeddingsDirectory, file));
      }
      console.log('done!');

      return exits.success('ok');
    } catch (error) {
      console.log('Error in helpers/ai/langchain-insert', error);
    }
    return exits.success('');
  },
};
