const sanitizeHtml = require('sanitize-html');
const {
  appEnvironment,
  PRODUCTION_ENV,
} = require('../../../utils/appEnvironment');

const { getCrmCompanyOwnerName } = require('../../../utils/crm/getCrmCompanyOwnerName.js');

const isUrl = require('validator/lib/isURL')


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
      type:'string',
    },
    typeText: {
      type:'string',
    }
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
      const { budget, audience, script, date, message, voicemail, voterFileUrl, type } = inputs;
      const { user } = this.req;
      const { firstName, lastName, email, phone } = user;
      const campaign = await sails.helpers.campaign.byUser(user.id);
      const crmCompany = await sails.helpers.crm.getCompany(campaign);
      const assignedPa = await getCrmCompanyOwnerName(crmCompany);
      const aiGeneratedScript = sanitizeHtml(campaign.aiContent[script].content, {
        allowedTags: [],
        allowedAttributes: {},
      });

      // if (voterFileUrl && !isUrl(voterFileUrl)) { // This WILL filter out localhost URLs, comment out if localhost testing
      //   console.log('Not a valid url:', voterFileUrl)
      //   throw new Error('Invalid voterFileUrl')
      // }

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
${voterFileUrl ? `🔒 <${voterFileUrl}|Voter File Download>` : 'Not provided'}

*Campaign Details:*
￮ Campaign Type: ${type}
￮ Budget: $${budget}
￮ Scheduled Date: ${date}
￮ Script Key: ${script}

*AI-Generated Script:*
\`\`\`
${aiGeneratedScript}
\`\`\`

*Message From User:*
￮ Message: ${message}

*Audience Selection:*
${Object.entries(audience)
  .map(([key, value]) => `￮ ${key}: ${value ? '✅ Yes' : '❌ No'}`)
  .join('\n')}

${voicemail !== undefined ? `￮ Voicemail: ${voicemail? 'Yes' : 'No'}` : ''}
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
