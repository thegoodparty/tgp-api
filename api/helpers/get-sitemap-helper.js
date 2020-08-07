const request = require('request-promise');

module.exports = {
  friendlyName: 'S3 Uploader',

  description: 'Get a file from scrape bucket',

  inputs: {
    fileName: {
      friendlyName: 'filename in s3 bucket',
      type: 'string',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { fileName } = inputs;
      const content = await request(
        `https://s3-us-west-2.amazonaws.com/scrape.thegoodparty.org/${fileName}`,
      );
      if (!content || content.length === 0) {
        console.log(`empty file on s3 ${fileName}`);
        throw new Error(`empty file on s3 ${fileName}`);
      }
      return exits.success({
        content,
      });
    } catch (e) {
      await sails.helpers.errorLoggerHelper('error getting file from s3', e);
      console.log('error getting file from s3', e);
      throw new Error(`error getting file from s3`, e);
    }
  },
};
