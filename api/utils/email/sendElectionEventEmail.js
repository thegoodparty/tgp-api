const sendElectionEventEmail = async function ({
  campaign,
  subject,
  templateName,
  emailVars,
}) {
  const { user } = campaign;
  await sails.helpers.mailgun.mailgunTemplateSender(
    user.email,
    subject,
    templateName,
    emailVars,
    '',
    'GoodParty.org <politics@goodparty.org>',
  );
};

module.exports = { sendElectionEventEmail };
