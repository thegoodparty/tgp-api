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

      const assignedPa = await getCrmCompanyOwnerName(crmCompany);
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
          return `￮ ${key}: ${value ? '✅ Yes' : '❌ No'}`;
        })
        // eslint-disable-next-line eqeqeq
        .filter((val) => val != undefined)
        .join('\n');

      // Upload image
      const bucket = `${assetsBase}/scheduled-campaign/${campaign.slug}/${type}/${date}`;
      const response = await sails.helpers.images.uploadImage(image, bucket);
      const uploadedImage = response.data.files[0];
      const imageUrl = `https://${bucket}/${uploadedImage}`;

      await sails.helpers.slack.slackHelper(
        {
          title: '🚨Campaign Schedule Request🚨',
          body: `🚨*Campaign Schedule Request*🚨

*Candidate/User:*
￮ Name: ${firstName} ${lastName}
￮ Email: ${email}
￮ Phone: ${phone}

*Assigned Political Advisor (PA):*
￮ Assigned PA:
  ${assignedPa || 'None Assigned'}

  ${
    crmCompany?.id
      ? `https://app.hubspot.com/contacts/21589597/record/0-2/${crmCompany.id}`
      : 'No CRM company found'
  }

*Voter File Download Link:*
${
  voterFileUrl
    ? `🔒 <${voterFileUrl}|Voter File Download>`
    : 'Error: Not provided or invalid'
}

*Campaign Details:*
￮ Campaign Type: ${type}
￮ Budget: $${budget}
￮ Scheduled Date: ${date}
￮ Script Key: ${script}

*Messaging Script:*
\`\`\`
${messagingScript}
\`\`\`

${uploadedImage ? `*Image File:*\n${imageUrl}\n` : ''}
*Message From User:*
￮ Message: ${message}

*Audience Selection:*
${formattedAudience}
￮ Audience Request: ${audience['audience_request'] || 'N/A'}

${voicemail !== undefined ? `￮ Voicemail: ${voicemail ? 'Yes' : 'No'}` : ''}
`,
        },
        appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
      );

      return exits.success({ message: 'ok' });
    } catch (error) {
      console.error('Error voter file schedule:', error);
      return exits.badRequest(error);
    }
  },
};
