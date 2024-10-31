const { getFormattedDateString } = require('../../dates');
const {
  sendElectionEventEmail,
} = require('../../email/sendElectionEventEmail');
const { resolveUserName } = require('../../user/resolveUserName');
const sendCancellationRequestConfirmationEmail = (campaign) => {
  const { user } = campaign;
  const subscriptionEndDate = getFormattedDateString(
    new Date(campaign.details.subscriptionCancelAt * 1000),
  );
  sendElectionEventEmail({
    campaign,
    subject: `Your Cancellation Request Has Been Processed – Pro Access Until ${subscriptionEndDate}`,
    templateName: 'subscription-cancellation-confirmation',
    emailVars: {
      userFullName: resolveUserName(user),
      subscriptionEndDate,
    },
  });
};

module.exports = {
  sendCancellationRequestConfirmationEmail,
};
