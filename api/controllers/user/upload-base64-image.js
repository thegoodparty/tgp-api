const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;

module.exports = {
  friendlyName: 'Upload Avatar',
  inputs: {
    image: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'uploaded',
      responseType: 'ok',
    },
    badRequest: {
      description: 'upload failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { image } = inputs;
      const uuid = Math.random().toString(36).substring(2, 16);

      const buffer = Buffer.from(
        image.replace(/^data:image\/.*;base64,/, ''),
        'base64',
      );
      console.log('buffer', buffer);
      const fileName = `${uuid}.png`;

      const outputFile = path.join(
        __dirname,
        `../../../tempImages/${fileName}`,
      );

      fs.writeFileSync(outputFile, buffer);
      const s3Url = await uploadToS3(outputFile, fileName);
      console.log('s3Url', s3Url);
      await sails.helpers.images.optimizeImage(s3Url, outputFile);
      const optimizedS3Url = await uploadToS3(outputFile, fileName);
      fs.unlinkSync(outputFile);
      return exits.success({ url: optimizedS3Url });

      // const { user } = this.req;
      // const bucket = `${assetsBase}/uploads`;
      // const response = await sails.helpers.images.uploadImage(file, bucket);
      // const avatar = `https://${bucket}/${response.data.files[0]}`;
      // const updatedUser = await User.updateOne({ id: user.id }).set({
      //   avatar,
      // });
    } catch (e) {
      console.log('error in upload-base64-image', e);
      return exits.badRequest({
        message: 'Error uploading upload-base64-image.',
      });
    }
  },
};

async function uploadToS3(localFile, fileName) {
  const bucketName = `${assetsBase}/candidate-info`;

  const content = fs.readFileSync(localFile);

  let params = {
    Bucket: bucketName,
    Key: fileName,
    Body: content,
    ContentType: 'image/png',
    ACL: 'public-read',
    CacheControl: 'max-age=31536000',
  };

  const s3 = new AWS.S3({
    accessKeyId: s3Key,
    secretAccessKey: s3Secret,
  });

  await s3.putObject(params).promise();

  return `https://${bucketName}/${fileName}`;
}
