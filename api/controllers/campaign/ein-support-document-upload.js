const { getEinSupportDocumentFilename } = require('../../utils/campaign/get-ein-support-document-filename');
const { uploadSingleFileToS3 } = require('../../utils/upload-single-file-to-s3');

module.exports = {
  friendlyName: 'Campaign EIN Support Document Upload',
  description: 'Admin endpoint to create a candidate.',
  inputs: {
    document: {
      type: 'ref',
      required: true,
      description: 'PDF document to upload to S3',
      example: '===',
    },
  },
  files: ['document'],
  exits: {
    success: {
      description: 'Document uploaded successfully',
      responseType: 'ok',
    },
    failure: {
      description: 'Document upload failed',
      responseType: 'serverError',
    },
    badRequest: {
      description: 'Missing document',
      responseType: 'badRequest',
    },
  },
  fn: async function(inputs, exits) {
    const { document } = inputs;
    const { success, failure, badRequest } = exits;
    const { user, file } = this.req;

    if (!document) {
      return ('document is required');
    }

    const campaignRecord = await sails.helpers.campaign.byUser(user);

    if (!campaignRecord) {
      return exits.forbidden();
    }

    const fileName = getEinSupportDocumentFilename(campaignRecord);
    // TODO: restrict access to these files for admins only to view
    const bucket = `ein-supporting-documents`;

    let uploadedFile = null;
    try {
      uploadedFile = await uploadSingleFileToS3({
        file: document,
        bucket,
        fileName,
      });
    } catch (e) {
      sails.log.error('Error uploading EIN supporting document', e);
      return failure('Error uploading EIN supporting document');
    }

    return success({
      message: 'Document uploaded successfully',
      uploadedFilename: uploadedFile.fd,
    });
  },
};
