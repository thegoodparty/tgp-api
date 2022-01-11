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
  const appBase = sails.config.custom.appBase || sails.config.appBase;
  let env = 'dev';
  if (appBase === 'https://goodparty.org') {
    env = 'prod';
  }

  const message = {
    text: `Candidate application submitted. ENV: ${env}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Candidate application submitted. ENV: ${env}.*__________________________________ \n\n
          ${JSON.stringify(data, undefined, 4)}
          `,
        },
      },
    ],
  };

  await sails.helpers.slackHelper(message, 'content');
}
