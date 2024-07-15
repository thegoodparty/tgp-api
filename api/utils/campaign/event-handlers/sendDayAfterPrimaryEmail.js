const {
  sendElectionEventEmail,
} = require('../../email/sendElectionEventEmail');

const sendDayAfterPrimaryEmail = async (campaign) => {
  const { user } = campaign;
  await sendElectionEventEmail({
    campaign,
    subject: `Your Primary Results – What's Next for Your Campaign?`,
    templateName: 'day-after-primary',
    emailVars: {
      userFullName: await sails.helpers.user.name(user),
    },
  });
  await sails.helpers.campaign.patch(
    campaign.id,
    'details',
    'primaryEmailSent',
    true,
  );
};
module.exports = {
  sendDayAfterPrimaryEmail,
};
