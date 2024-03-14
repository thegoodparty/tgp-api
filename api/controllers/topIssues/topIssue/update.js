const svgUploader = async (fileName, bucketName, svgData) => {
  console.log(`fileName, bucketName, svgData =>`, fileName, bucketName, svgData)
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
    return `https://${bucketPath}/${fileName}`
  } catch (e) {
    console.error(new Error(e))
    return e
  }
}

module.exports = {
  friendlyName: 'edit topIssue',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    icon: {
      type: 'string'
    }
  },

  exits: {
    success: {
      description: 'Updated',
    },

    badRequest: {
      description: 'Error updating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id, name, icon } = inputs;
      await TopIssue.updateOne({ id }).set({
        name,
        icon: await sails.helpers.svgUploader(
          `${id}-topissue-icon.svg`,
          'top-issue-icons',
          icon
        )
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('error at topIssue/update', e);
      return exits.badRequest({
        message: 'Error updating topIssue',
        e,
      });
    }
  },
};
