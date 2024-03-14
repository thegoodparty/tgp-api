module.exports = {
  friendlyName: 'SVG Uploader',

  description:
    'Upload an .svg file to a bucket in S3',

  inputs: {
    fileName: {
      friendlyName: 'Name of file to upload',
      type: 'string',
    },
    bucketName: {
      friendlyName: 's3 bucket name',
      type: 'string',
    },
    svgData: {
      friendlyName: 'image/scg+xml data to place in file',
      type: 'string',
    }
  },

  fn: async function(inputs, exits){
    const { fileName, bucketName, svgData } = inputs
    const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;
    const bucketPath = `${assetsBase}/${bucketName}`

    try {
      await sails.helpers.s3Uploader(
        {
          Key: fileName,
          ContentType: `image/svg+xml`,
          CacheControl: 'max-age=31536000',
          Body: svgData
        },
        bucketPath
      );
      return exits.success(`https://${bucketPath}/${fileName}`)
    } catch (e) {
      console.error('Error uploading SVG', new Error(e))
      throw new Error(e)
    }
  }
}
