const moment = require('moment/moment');
const {
  sendElectionEventEmail,
} = require('../../email/sendElectionEventEmail');
const { resolveUserName } = require('../../user/resolveUserName');

const sendProSubscriptionEndingEmail = function (campaign) {
  const { user } = campaign;
  const todayMoment = moment();
  sendElectionEventEmail({
    campaign,
    subject: `Your Pro Subscription is Ending Today`,
    templateName: 'end-of-pro-subscription',
    emailVars: {
      userFullName: resolveUserName(user),
      todayDateString: todayMoment.format('DD MMMM, YYYY'),
    },
  });
};

module.exports = {
  sendProSubscriptionEndingEmail,
};
