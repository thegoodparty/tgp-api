const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;

module.exports = {
  friendlyName: 'Upload Avatar',
  inputs: {
    image: {
      type: 'string',
      required: true,
    },
    entity: {
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
      const { image, entity } = inputs;
      if (entity !== 'user' && entity !== 'candidate') {
        return exits.badRequest({
          message: 'entity should be user or candidate.',
        });
      }
      const candidateName = 'tomer-almog';

      const buffer = Buffer.from(
        image.replace(/^data:image\/.*;base64,/, ''),
        'base64',
      );
      console.log('buffer', buffer);
      const tempFileName = `base64Upload-${candidateName}.png`;

      const outputFile = path.join(
        __dirname,
        `../../../tempImages/${tempFileName}`,
      );

      fs.writeFileSync(outputFile, buffer);
      const uuid = Math.random().toString(36).substring(2, 8);
      const s3Url = await uploadToS3(outputFile, candidateName, uuid);
      console.log('s3Url', s3Url);
      fs.unlinkSync(outputFile);
      return exits.success({ url: s3Url });

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

async function uploadToS3(localFile, candidateName, uuid) {
  const bucketName = `${assetsBase}/candidate-info`;

  const content = fs.readFileSync(localFile);

  const fileName = `${candidateName}-${uuid}.png`;

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