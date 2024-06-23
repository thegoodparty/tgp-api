const EIN_SUPPORT_DOCUMENT_FILENAME_POSTFIX = `ein-support-document.pdf`;

const getEinSupportDocumentFilename = ({ id, slug }) =>
  `${id}-${slug}-${EIN_SUPPORT_DOCUMENT_FILENAME_POSTFIX}`;

module.exports = {
  EIN_SUPPORT_DOCUMENT_FILENAME_POSTFIX,
  getEinSupportDocumentFilename,
};
