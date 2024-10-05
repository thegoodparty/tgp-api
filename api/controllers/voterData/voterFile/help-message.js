const {
  appEnvironment,
  PRODUCTION_ENV,
} = require('../../../utils/appEnvironment');

const { getCrmCompanyOwnerName } = require('../../../utils/crm/getCrmCompanyOwnerName.js');

module.exports = {
  inputs: {
    type: {
      type: 'string',
      required: true,
    },
    message: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Bad request',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { type, message } = inputs;
      const { user } = this.req;
      const { firstName, lastName, email, phone } = user;
      const campaign = await sails.helpers.campaign.byUser(user.id);
      const { details, tier } = campaign;
      const crmCompany = await sails.helpers.crm.getCompany(campaign);
      const assignedPa = await getCrmCompanyOwnerName(crmCompany);
      const candidateOffice = details.office?.toLowerCase().trim() === 'other' ? details.otherOffice : details.office;

      await sails.helpers.slack.slackHelper(
        {
          title: '🚨*Voter File Assistance Request*🚨',
          body: `🚨*Voter File Assistance Request*🚨

*Candidate/User:*
￮ Name: ${firstName} ${lastName} 
￮ Email: ${email}
￮ Phone: ${phone}

Office: ${candidateOffice}
State: ${details.state}
Viability Tier: ${tier}

Type: ${type}

*Message from Candidate*: ${message}

*Assigned PA:*
  ${assignedPa || 'None Assigned'}
      ${
        crmCompany?.id
          ? `https://app.hubspot.com/contacts/21589597/record/0-2/${crmCompany.id}`
          : 'No CRM company found'
      }
`,
        },
        appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
      );

      return exits.success({ message: 'ok' });
    } catch (error) {
      console.error('Error voter file help:', error);
      return exits.serverError(error);
    }
  },
};
