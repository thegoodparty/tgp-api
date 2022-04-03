const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

const path = require('path');

module.exports = {
  friendlyName: 'Cache helper',

  description:
    'in memoery caching using cacheman: https://github.com/cayasso/cacheman',

  inputs: {
    imgPath: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Cache operation done',
    },
    badRequest: {
      description: 'Error caching',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { imgPath } = inputs;

      const outputFolder = path.join(
        __dirname,
        `../../../tempImages`,
      );

      await imagemin([imgPath], {
        destination: outputFolder,
        plugins: [imageminPngquant()],
      });

      return exits.success('ok');

      // const bucketName = `${assetsBase}/candidate-info`;
      //
      // const content = fs.readFileSync(outputFile);
      // const uuid = Math.random()
      //   .toString(36)
      //   .substring(2, 16);
      // const fileName = `${uuid}-optimized.png`;
      //
      // let params = {
      //   Bucket: bucketName,
      //   Key: fileName,
      //   Body: content,
      //   ContentType: 'image/png',
      //   ACL: 'public-read',
      //   CacheControl: 'max-age=31536000',
      // };
      //
      // const s3 = new AWS.S3({
      //   accessKeyId: s3Key,
      //   secretAccessKey: s3Secret,
      // });
      //
      // await s3.putObject(params).promise();
      //
      // const s3Url = `https://${bucketName}/${fileName}`;
      // return exits.success(s3Url);
    } catch (e) {
      console.log('error at transparent image helper', e);
      return exits.success(inputs.url);
    }
  },
};
