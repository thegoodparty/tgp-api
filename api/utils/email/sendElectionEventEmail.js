const sendElectionEventEmail = function ({
  campaign,
  subject,
  templateName,
  emailVars,
}) {
  const { user } = campaign;
  sails.helpers.mailgun.mailgunTemplateSender(
    user.email,
    subject,
    templateName,
    emailVars,
    '',
    'GoodParty.org <politics@goodparty.org>',
  );
};

module.exports = { sendElectionEventEmail };
