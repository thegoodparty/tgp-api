/* eslint-disable object-shorthand */

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    key: {
      type: 'string',
      required: true,
    },
    subSectionKey: {
      type: 'string',
      required: true,
    },
    regenerate: {
      type: 'boolean',
    },
    editMode: {
      type: 'boolean',
    },
    chat: {
      type: 'ref',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;
      const { key, subSectionKey, regenerate, editMode, chat } = inputs;
      await sails.helpers.queue.consumer();

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }
      if (
        !campaign.campaignPlanStatus ||
        typeof campaign.campaignPlanStatus === 'string'
      ) {
        campaign.campaignPlanStatus = {};
      }

      if (!regenerate && campaign.campaignPlanStatus[key] === 'processing') {
        return exits.success({
          status: 'processing',
          step: 'waiting',
          key,
        });
      }
      const existing = campaign[subSectionKey] && campaign[subSectionKey][key];

      if (
        !editMode &&
        campaign.campaignPlanStatus[key] === 'completed' &&
        existing
      ) {
        return exits.success({
          status: 'completed',
          chatResponse: campaign[subSectionKey][key],
        });
      }

      // generating a new campaign here
      if (!campaign[subSectionKey]) {
        campaign[subSectionKey] = {};
      }

      // checking if this is the first time the campaign plan is visited. If so - send a slack message.
      if (key === 'slogan' && !regenerate && !campaign[subSectionKey][key]) {
        await sendSlackMessage(campaign, user);
      }

      const cmsPrompts = await sails.helpers.ai.getPrompts();
      let prompt = cmsPrompts[key];
      prompt = await sails.helpers.ai.promptReplace(prompt, campaign);
      await sails.helpers.errorLoggerHelper('prompt', {
        cmsPrompt: cmsPrompts[key],
        promptAfterReplace: prompt,
      });

      const queueMessage = {
        type: 'generateCampaignPlan',
        data: {
          slug: campaign.slug,
          prompt,
          subSectionKey,
          key,
          existingChat: chat || [],
        },
      };

      await sails.helpers.queue.enqueue(queueMessage);
      await sails.helpers.errorLoggerHelper('Enqueued AI prompt', queueMessage);

      campaign.campaignPlanStatus[key] = 'processing';
      await Campaign.updateOne({
        slug: campaign.slug,
      }).set({
        data: campaign,
      });
      await sails.helpers.queue.consumer();

      return exits.success({
        status: 'processing',
        step: 'created',
        key,
      });
    } catch (e) {
      console.log('Error generating AI response', e);
      if (e.data && e.data.error) {
        console.log('*** error*** :', e.data.error);
        return exits.badRequest();
      }
      return exits.badRequest();
    }
  },
};

async function sendSlackMessage(campaign, user) {
  const { slug, details } = campaign;
  const { firstName, lastName, office, state, district } = details;
  const slackMessage = {
    text: `Onboarding Alert!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `__________________________________ \n *Candidate completed details section * \n ${appBase}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*We need to add their admin Path to victory*\n
          \nName:${firstName} ${lastName}\n
          \nOffice:${office}\n
          \nState:${state}\n
          \nDistrict:${district}\n
          \nemail:${user.email}\n
          \nslug:${slug}\n
          \nadmin link: ${appBase}/admin/victory-path
          `,
        },
      },
    ],
  };

  await sails.helpers.slackHelper(slackMessage, 'victory');
}
