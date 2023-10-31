/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Campaigns.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Find Campaign associated with user',

  inputs: {},

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }

      if (!campaign) {
        console.log('no campaign');
        return exits.forbidden();
      }

      if (
        campaign.launchStatus === 'pending' ||
        campaign.launchStatus === 'launched'
      ) {
        return exits.success({
          slug: campaign.candidateSlug || campaign.slug,
        });
      }

      const updated = await Campaign.updateOne({ slug: campaign.slug }).set({
        data: {
          ...campaign,
          launchStatus: 'pending',
        },
      });

      await sails.helpers.slack.errorLoggerHelper(
        'About to send slack message to campaign',
        updated,
      );

      await sendSlackMessage(campaign, user);

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('Error at campaign launch request', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at campaign launch-request',
        e,
      );
      return exits.forbidden();
    }
  },
};

async function sendSlackMessage(campaign, user) {
  const appBase = sails.config.custom.appBase || sails.config.appBase;

  if (appBase !== 'https://goodparty.org') {
    return;
  }
  const { slug, details } = campaign;
  const { firstName, lastName, office, state, district } = details;
  const slackMessage = {
    text: `Campaign Launch is pending a review`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `__________________________________ \n *Candidate wants to launch a campaign * \n ${appBase}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Hi <@U01AY0VQFPE> and <@U03RY5HHYQ5> *\n
          \nName: ${firstName} ${lastName}
          \nOffice: ${office}
          \nState: ${state}
          \nDistrict: ${district}
          \nemail: ${user.email}
          \nslug: ${slug}\n
          \ncandidate page: ${appBase}/candidate/${slug}/review
          `,
        },
      },
    ],
  };

  await sails.helpers.slack.slackHelper(slackMessage, 'victory');
}
