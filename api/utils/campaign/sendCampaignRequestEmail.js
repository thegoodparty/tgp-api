const sendCampaignRequestEmail = async ({
  toEmail,
  templateName,
  subject,
  emailTemplateData,
}) => {
  try {
    await sails.helpers.mailgun.mailgunTemplateSender(
      toEmail,
      subject,
      templateName,
      emailTemplateData,
      '',
      'GoodParty.org <politics@goodparty.org>',
    );
  } catch (e) {
    console.error(
      `error sending campaign request email. Email options: ${JSON.stringify({
        toEmail,
        templateName,
        subject,
      })}`,
      e,
    );
  }
};

module.exports = {
  sendCampaignRequestEmail,
};
