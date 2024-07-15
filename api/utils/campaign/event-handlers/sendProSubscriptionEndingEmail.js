const moment = require('moment/moment');
const {
  sendElectionEventEmail,
} = require('../../email/sendElectionEventEmail');

const sendProSubscriptionEndingEmail = async function (campaign) {
  const { user } = campaign;
  const todayMoment = moment();
  await sendElectionEventEmail({
    campaign,
    subject: `Your Pro Subscription is Ending Today`,
    templateName: 'end-of-pro-subscription',
    emailVars: {
      userFullName: await sails.helpers.user.name(user),
      todayDateString: todayMoment.format('DD MMMM, YYYY'),
    },
  });
};

module.exports = {
  sendProSubscriptionEndingEmail,
};
