const moment = require('moment/moment');
const EMAIL_DAYS_AFTER_PRIMARY = 1;
const EMAIL_DAYS_AFTER_ELECTION = 3;
const CANCEL_DAYS_AFTER_ELECTION = 7;

const findActionNeededCampaigns = (campaigns = []) => {
  const today = moment();
  return campaigns.reduce(
    (acc, campaign) => {
      const { details = {} } = campaign;
      const returnAcc = {
        ...acc,
      };
      const { primaryElectionDate, electionDate } = details;
      const electionMoment = moment(electionDate);
      const primaryMoment = moment(primaryElectionDate);
      const relativeToPrimaryDays = today.diff(primaryMoment, 'day');
      const relativeToElectionDays = today.diff(electionMoment, 'day');
      if (
        relativeToPrimaryDays >= EMAIL_DAYS_AFTER_PRIMARY &&
        !details.primaryEmailSent
      ) {
        returnAcc.afterPrimaryEmailCampaigns.push(campaign);
      }
      if (
        relativeToElectionDays >= EMAIL_DAYS_AFTER_ELECTION &&
        !details.afterElectionEmailSent
      ) {
        returnAcc.afterElectionEmailCampaigns.push(campaign);
      }
      if (
        today.diff(electionMoment, 'day') >= CANCEL_DAYS_AFTER_ELECTION &&
        details.subscriptionId
      ) {
        returnAcc.cancelCampaigns.push(campaign);
      }
      return returnAcc;
    },
    {
      afterPrimaryEmailCampaigns: [],
      afterElectionEmailCampaigns: [],
      cancelCampaigns: [],
    },
  );
};

module.exports = {
  findActionNeededCampaigns,
};
