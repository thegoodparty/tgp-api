module.exports = {
  friendlyName: 'Admin application approval',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    feedback: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'rejected',
    },

    badRequest: {
      description: 'Error rejecting',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id, feedback } = inputs;
      const user = this.req.user;
      const application = await Application.findOne({
        id,
      });
      let existingData = {};
      if (application.data && application.data !== '') {
        existingData = JSON.parse(application.data);
      }
      delete application.data;

      const newData = {
        ...application,
        ...existingData,
        feedback,
        status: 'rejected',
      };

      await Application.updateOne({
        id,
      }).set({
        status: 'rejected',
        data: JSON.stringify(newData),
      });
      try {
        await sendSlackMessage(newData);
      } catch (e) {
        console.log('error sending slack');
      }

      const applicationApproved = await Application.count({
        user: user.id,
        status: 'approved',
      });
      const applicationDeclined = await Application.count({
        user: user.id,
        status: 'rejected',
      });

      await sails.helpers.crm.update(user, {
        application_approved: applicationApproved,
        application_declined: applicationDeclined,
      });

      return exits.success({
        application: newData,
      });
    } catch (e) {
      console.log('error at applications/rejected', e);
      return exits.badRequest({
        message: 'Error rejecting applications',
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
    text: `Candidate application rejected. ENV: ${env}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Candidate application rejected. ENV: ${env}. (This is a temp message)`,
        },
      },
    ],
  };

  await sails.helpers.slackHelper(message, 'content');
}
