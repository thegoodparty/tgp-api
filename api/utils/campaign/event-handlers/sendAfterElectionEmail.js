const moment = require('moment/moment');
const {
  sendElectionEventEmail,
} = require('../../email/sendElectionEventEmail');

const sendAfterElectionEmail = async (campaign) => {
  const { user } = campaign;
  const electionMoment = moment(campaign.details.electionDate);
  const cancellationMoment = electionMoment.clone().add(7, 'days');
  await sendElectionEventEmail({
    campaign,
    subject: `Your Primary Results – What's Next for Your Campaign?`,
    templateName: 'after-election',
    emailVars: {
      userFullName: await sails.helpers.user.name(user),
      subscriptionEndDateString: cancellationMoment.format('DD MMMM, YYYY'),
    },
  });
  await sails.helpers.campaign.patch(
    campaign.id,
    'details',
    'afterElectionEmailSent',
    true,
  );
};

module.exports = {
  sendAfterElectionEmail,
};
