const EIN_SUPPORT_DOCUMENT_FOLDERNAME_POSTFIX = `ein-support-documents`;

const getEinSupportDocumentFolderName = ({ id, slug }) =>
  `${id}-${slug}-${EIN_SUPPORT_DOCUMENT_FOLDERNAME_POSTFIX}`;

module.exports = {
  EIN_SUPPORT_DOCUMENT_FILENAME_POSTFIX:
    EIN_SUPPORT_DOCUMENT_FOLDERNAME_POSTFIX,
  getEinSupportDocumentFolderName,
};
