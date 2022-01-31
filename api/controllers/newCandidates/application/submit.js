const appBase = sails.config.custom.appBase || sails.config.appBase;
let env = 'dev';
if (appBase === 'https://goodparty.org') {
  env = 'prod';
}

module.exports = {
  friendlyName: 'create a issue topic',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Created',
    },

    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id } = inputs;
      const user = this.req.user;
      const application = await Application.findOne({
        id,
        user: user.id,
      });
      let existingData = {};
      if (application.data && application.data !== '') {
        existingData = JSON.parse(application.data);
      }
      delete application.data;

      const newData = {
        ...application,
        ...existingData,
        status: 'in review',
      };

      await Application.updateOne({
        id,
        user: user.id,
      }).set({
        status: 'in review',
        data: JSON.stringify(newData),
      });
      try {
        await sendSlackMessage(newData);
      } catch (e) {
        console.log('error sending slack');
      }
      try {
        await sendEmail(newData);
      } catch (e) {
        console.log('error sending slack');
      }

      return exits.success({
        application: newData,
      });
    } catch (e) {
      console.log('error at applications/update', e);
      return exits.badRequest({
        message: 'Error updating applications',
        e,
      });
    }
  },
};

async function sendSlackMessage(data) {
  const summary = `
  • *Name:* ${data.candidate.firstName}  ${
    data.candidate.lastName
  }\n• *Office Sought:* ${
    data.campaign['running for']
  }\n• *Date of Election:* ${
    data.campaign.electionDate
  }\n• *Party Affiliation:* ${
    data.candidate.party
  }\n• *Application:* <${appBase}/campaign-application/${
    data.id
  }/1|Admin Approval Link>
 `;

  const message = {
    text: `Candidate application submitted. ENV: ${env}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `__________________________________ \n*Candidate application submitted*.\n*ENV*: ${env}\n\n${summary}
          `,
        },
      },
    ],
  };

  await sails.helpers.slackHelper(message, 'content');
}

async function sendEmail(data) {
  const to = 'politics@goodparty.org';
  const subject = 'Candidate Application submitted';
  const template = 'appplication-submission';
  // const templateDomain = encodeURI(domain);
  const link = `${appBase}/campaign-application/${data.id}/1`;
  const content = { link };
  content.sections = [];

  const candidateSection = createSection(data.candidate, 'Candidate');
  content.sections.push(candidateSection);

  const campaignSection = createSection(data.campaign, 'Campaign');
  content.sections.push(campaignSection);

  const contactsSection = createSection(data.contacts, 'Contacts');
  content.sections.push(contactsSection);

  const issuesSection = createSection(data.issues, 'Positions');
  content.sections.push(issuesSection);

  const endorsementsSection = createSection(
    { endorsements: data.endorsements },
    'Endorsements',
  );
  content.sections.push(endorsementsSection);
  const variables = JSON.stringify(content);
  await sails.helpers.mailgun.mailgunTemplateSender(
    to,
    subject,
    template,
    variables,
  );
}

function createSection(data, name) {
  const section = { name };
  section.body = [];
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      section.body.push({ key: camelToSpaces(key), value: data[key] });
    } else if (Array.isArray(data[key])) {
      section.body.push({
        key: camelToSpaces(key),
        value: JSON.stringify(data[key]),
      });
    }
  });
  return section;
}

function camelToSpaces(str) {
  return (
    str
      .replace(/([A-Z])/g, ' $1')
      // uppercase the first character
      .replace(/^./, function(str) {
        return str.toUpperCase();
      })
  );
}
