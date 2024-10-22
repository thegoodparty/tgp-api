const sanitizeHtml = require('sanitize-html');
const {
  appEnvironment,
  PRODUCTION_ENV,
} = require('../../../utils/appEnvironment');

const {
  getCrmCompanyOwnerName,
} = require('../../../utils/crm/getCrmCompanyOwnerName.js');

const isUrl = require('validator/lib/isURL');

const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;

module.exports = {
  inputs: {
    budget: {
      type: 'number',
      required: true,
    },
    audience: {
      type: 'json',
      required: true,
    },
    script: {
      type: 'string',
      required: true,
    },
    date: {
      type: 'string',
      required: true,
    },
    message: {
      type: 'string',
      required: true,
    },
    voicemail: {
      type: 'boolean',
    },
    voterFileUrl: {
      type: 'string',
    },
    type: {
      type: 'string',
    },
    image: {
      type: 'ref',
    },
  },
  files: ['image'],
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
      const {
        budget,
        audience: audienceInput,
        script,
        date,
        message,
        voicemail,
        image,
        type,
      } = inputs;
      let voterFileUrl = inputs.voterFileUrl;
      const { user } = this.req;
      const { firstName, lastName, email, phone } = user;
      const audience =
        typeof audienceInput === 'string'
          ? JSON.parse(audienceInput)
          : audienceInput;

      const campaign = await sails.helpers.campaign.byUser(user.id);
      if (!campaign) {
        throw new Error(`Campaign not found for user ID: ${user.id}`);
      }

      const crmCompany = await sails.helpers.crm.getCompany(campaign);
      if (!crmCompany) {
        throw new Error(`crmCompany not found for ${campaign}`);
      }

      const assignedPa = await getCrmCompanyOwnerName(crmCompany, true);
      const messagingScript = campaign.aiContent[script]?.content
        ? sanitizeHtml(campaign.aiContent[script]?.content, {
            allowedTags: [],
            allowedAttributes: {},
          })
        : script;

      if (
        voterFileUrl &&
        !isUrl(voterFileUrl) &&
        !voterFileUrl.startsWith('http://localhost')
      ) {
        console.error('voterFileUrl is invalid');
        voterFileUrl = null;
      }

      const formattedAudience = Object.entries(audience)
        .map(([key, value]) => {
          if (key === 'audience_request') {
            return;
          }

          return {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: `${key}: `,
                style: {
                  bold: true,
                },
              },
              {
                type: 'text',
                text: value ? '✅ Yes' : '❌ No',
              },
            ],
          };
        })
        // eslint-disable-next-line eqeqeq
        .filter((val) => val != undefined);

      // Upload image
      const bucket = `${assetsBase}/scheduled-campaign/${campaign.slug}/${type}/${date}`;
      const response = await sails.helpers.images.uploadImage(image, bucket);
      const uploadedImage = response.data.files[0];
      const imageUrl = uploadedImage
        ? `https://${bucket}/${uploadedImage}`
        : null;

      const slackBlocks = buildSlackBlocks({
        name: `${firstName} ${lastName}`,
        email,
        phone,
        assignedPa,
        crmCompanyId: crmCompany?.id,
        voterFileUrl,
        type,
        budget,
        voicemail,
        date,
        script,
        messagingScript,
        imageUrl,
        message,
        formattedAudience,
        audienceRequest: audience['audience_request'],
      });

      await sails.helpers.slack.slackHelper(
        slackBlocks,
        appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
        false,
      );

      return exits.success({ message: 'ok' });
    } catch (error) {
      console.error('Error voter file schedule:', error);
      return exits.badRequest(error);
    }
  },
};

function buildSlackBlocks({
  name,
  email,
  phone,
  assignedPa,
  crmCompanyId,
  voterFileUrl,
  type,
  budget,
  voicemail,
  date,
  script,
  messagingScript,
  imageUrl,
  message,
  formattedAudience,
  audienceRequest,
}) {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚨 Campaign Schedule Request 🚨',
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
          ],
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'emoji',
              name: 'zap',
            },
            {
              type: 'text',
              text: ' Campaign Details:',
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
                  text: 'Campaign Type: ',
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
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: 'Budget: ',
                  style: {
                    bold: true,
                  },
                },
                {
                  type: 'text',
                  text: '$' + Number(budget).toLocaleString(),
                },
              ],
            },
            voicemail !== undefined
              ? {
                  type: 'rich_text_section',
                  elements: [
                    {
                      type: 'text',
                      text: 'Voicemail: ',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      type: 'text',
                      text: voicemail ? 'Yes' : 'No',
                    },
                  ],
                }
              : undefined,
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: 'Scheduled Date: ',
                  style: {
                    bold: true,
                  },
                },
                {
                  type: 'text',
                  text: String(date),
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: 'Script Key: ',
                  style: {
                    bold: true,
                  },
                },
                {
                  type: 'text',
                  text: String(script),
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'divider',
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
              text: ' Assigned Political Advisor (PA):',
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
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'emoji',
              name: 'lock',
            },
            {
              type: 'text',
              text: ' Voter File Download Link\n',
              style: {
                bold: true,
              },
            },
            voterFileUrl
              ? {
                  type: 'link',
                  text: 'Voter File Download',
                  url: String(voterFileUrl),
                }
              : {
                  type: 'text',
                  text: 'Error: Not provided or invalid',
                  style: {
                    bold: true,
                  },
                },
          ],
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'emoji',
              name: 'scroll',
            },
            {
              type: 'text',
              text: ' AI-Generated Script:',
              style: {
                bold: true,
              },
            },
          ],
        },
        {
          type: 'rich_text_preformatted',
          elements: [
            {
              type: 'text',
              text: String(messagingScript),
            },
          ],
        },
      ],
    },
    {
      type: 'divider',
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
              text: ' Message From User:\n',
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
              name: 'busts_in_silhouette',
            },
            {
              type: 'text',
              text: ' Audience Selection:',
              style: {
                bold: true,
              },
            },
          ],
        },
      ],
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_list',
          style: 'bullet',
          elements: [
            ...formattedAudience,
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: 'Audience Request: ',
                  style: {
                    bold: true,
                  },
                },
                {
                  type: 'text',
                  text: audienceRequest ? String(audienceRequest) : 'N/A',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'divider',
    },
    imageUrl
      ? {
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'emoji',
                  name: 'floppy_disk',
                },
                {
                  type: 'text',
                  text: ' Image File:',
                  style: {
                    bold: true,
                  },
                },
              ],
            },
          ],
        }
      : undefined,
    imageUrl
      ? {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: String(imageUrl),
          },
        }
      : undefined,
  ];

  return {
    // eslint-disable-next-line eqeqeq
    blocks: blocks.filter((block) => block != undefined),
  };
}
