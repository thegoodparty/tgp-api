const {
  appEnvironment,
  PRODUCTION_ENV,
} = require('../../../utils/appEnvironment');

const {
  getCrmCompanyOwnerName,
} = require('../../../utils/crm/getCrmCompanyOwnerName.js');

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
      const assignedPa = await getCrmCompanyOwnerName(crmCompany, true);
      const candidateOffice =
        details.office?.toLowerCase().trim() === 'other'
          ? details.otherOffice
          : details.office;

      const slackBlocks = buildSlackBlocks({
        name: `${firstName} ${lastName}`,
        email,
        phone,
        office: candidateOffice,
        state: details.state,
        tier,
        type,
        message,
        assignedPa,
        crmCompanyId: crmCompany?.id,
      });

      await sails.helpers.slack.slackHelper(
        slackBlocks,
        appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
        false,
      );

      return exits.success({ message: 'ok' });
    } catch (error) {
      console.error('Error voter file help:', error);
      return exits.serverError(error);
    }
  },
};

function buildSlackBlocks({
  name,
  email,
  phone,
  office,
  state,
  tier,
  type,
  message,
  assignedPa,
  crmCompanyId,
}) {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Voter File Assistance Request 🚨',
          emoji: true,
        },
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'emoji',
                name: 'gp',
              },
              {
                type: 'text',
                text: ' Candidate/User:',
                style: {
                  bold: true,
                },
              },
            ],
          },
          {
            type: 'rich_text_list',
            style: 'bullet',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Name: ',
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: String(name),
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Email: ',
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: String(email),
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Phone: ',
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: String(phone),
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Office: ',
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: String(office),
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'State: ',
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: String(state),
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Viability Tier: ',
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: String(tier),
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Type: ',
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: String(type),
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: '\n\n',
              },
            ],
          },
        ],
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'emoji',
                name: 'speech_balloon',
              },
              {
                type: 'text',
                text: ' Message from Candidate:',
                style: {
                  bold: true,
                },
              },
            ],
          },
          {
            type: 'rich_text_quote',
            elements: [
              {
                type: 'text',
                text: String(message),
              },
            ],
          },
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: '\n\n',
              },
            ],
          },
        ],
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'emoji',
                name: 'eyes',
              },
              {
                type: 'text',
                text: ' Assigned PA:',
                style: {
                  bold: true,
                },
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${assignedPa || 'None Assigned'}\n${
            crmCompanyId
              ? `https://app.hubspot.com/contacts/21589597/record/0-2/${crmCompanyId}`
              : 'No CRM company found'
          }`,
        },
      },
    ],
  };
}
