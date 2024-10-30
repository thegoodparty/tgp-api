const sendElectionEventEmail = async function ({
  campaign,
  subject,
  templateName,
  emailVars,
}) {
  const { user } = campaign;
  console.log(
    `{email: user.email,
      subject,
      templateName,
      emailVars,
      cc: '',
      from: 'GoodParty.org <politics@goodparty.org>'} =>`,
    {
      email: user.email,
      subject,
      templateName,
      emailVars,
      cc: '',
      from: 'GoodParty.org <politics@goodparty.org>',
    },
  );
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
