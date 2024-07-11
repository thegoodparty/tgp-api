const {
  getFormattedDateString,
  formatUSDateString,
  convertISO8601DateStringToUSDateString,
} = require('../dates');
const sendProConfirmationEmail = async (user, campaign) => {
  const { details: campaignDetails } = campaign;
  const { electionDate: ISO8601DateString } = campaignDetails;

  const formattedCurrentDate = getFormattedDateString(new Date());
  const electionDate =
    ISO8601DateString &&
    formatUSDateString(
      convertISO8601DateStringToUSDateString(ISO8601DateString),
    );

  const emailVars = {
    userFullName: await sails.helpers.user.name(user),
    startDate: formattedCurrentDate,
    ...(electionDate ? { electionDate } : {}),
  };

  try {
    await sails.helpers.mailgun.mailgunTemplateSender(
      user.email,
      `Welcome to Pro! Let's Empower Your Campaign Together`,
      'pro-confirmation',
      JSON.stringify(emailVars),
    );
  } catch (e) {
    await sails.helpers.slack.errorLoggerHelper(
      'Error sending pro confirmation email',
      e,
    );
  }
};

module.exports = {
  sendProConfirmationEmail,
};
