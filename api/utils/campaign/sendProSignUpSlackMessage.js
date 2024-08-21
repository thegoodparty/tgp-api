const { getCrmCompanyOwnerName } = require('../crm/getCrmCompanyOwnerName');
const { appEnvironment, PRODUCTION_ENV } = require('../appEnvironment');

const sendProSignUpSlackMessage = async (user, campaign) => {
  const { details = {} } = campaign || {};
  const { office, otherOffice, state } = details;
  const name = `${user.firstName}${user.firstName ? ` ${user.lastName}` : ''}`;
  const crmCompany = await sails.helpers.crm.getCompany(campaign);

  await sails.helpers.slack.slackHelper(
    {
      title: 'New Pro User!',
      body: `PRO PLAN SIGN UP!!! :gp:
          Name: ${name}
          Email: ${user.email}
          Campaign slug: ${campaign.slug}
          State: ${state}
          Office: ${office || otherOffice}
          Assigned PA: ${
            (await getCrmCompanyOwnerName(crmCompany)) || 'None assigned'
          }
          ${
            crmCompany?.id
              ? `https://app.hubspot.com/contacts/21589597/record/0-2/${crmCompany.id}`
              : 'No CRM company found'
          }
        `,
    },
    appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
  );
};

module.exports = { sendProSignUpSlackMessage };
