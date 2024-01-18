/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
const appBase = sails.config.custom.appBase || sails.config.appBase;
const moment = require('moment');

module.exports = {
  friendlyName: 'Update Campaign',

  inputs: {
    campaign: {
      type: 'json',
      required: true,
    },
    versionKey: {
      type: 'string',
    },
    subSectionKey: {
      type: 'string',
    },
    updateCandidate: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Campaign Updated',
      responseType: 'ok',
    },
    badRequest: {
      description: 'creation failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { campaign, versionKey, updateCandidate, subSectionKey } = inputs;
      const { user } = this.req;
      const existing = await Campaign.findOne({
        slug: campaign.slug,
      });

      // setting last_step_date for the crm
      // moment().format('YYYY-MM-DD'),
      if (campaign.currentStep !== existing?.data?.currentStep) {
        campaign.lastStepDate = moment().format('YYYY-MM-DD');
      }

      let inputValues = {};
      try {
        inputValues = existing?.data[subSectionKey][versionKey].inputValues;
      } catch (e) {
        // this is more informational since this is expected for campaign plan content.
      }

      if (versionKey && existing) {
        await sails.helpers.ai.saveCampaignVersion(
          campaign,
          subSectionKey || 'campaignPlan',
          versionKey,
          existing.id,
          inputValues,
        );
      }

      let launchP2V = false;
      if (
        campaign?.details?.pledged &&
        campaign.details.pledged === true &&
        (!campaign?.p2vStatus || campaign?.p2vStatus === 'Locked')
      ) {
        sails.helpers.log(slug, 'launching p2v...');
        campaign.p2vStatus = 'Waiting';
        launchP2V = true;
        await sails.helpers.queue.consumer();
      }

      // update can be done by an admin or a user.
      if (user.isAdmin) {
        await Campaign.updateOne({
          slug: campaign.slug,
        }).set({ data: campaign });
      } else {
        await Campaign.updateOne({
          slug: campaign.slug,
          user: user.id,
        }).set({ data: campaign });
      }

      const updated = await Campaign.findOne({
        slug: campaign.slug,
      });

      await updateUserPhone(updated.data, user);

      // Launch the Path to Victory queue
      if (launchP2V) {
        sails.helpers.log(slug, 'sending p2v slack message');
        await sendSlackMessage(updated, user);
        sails.helpers.log(slug, 'enqueuing p2v');
        await sails.helpers.queue.enqueuePathToVictory(updated);
      }

      if (user.isAdmin && updateCandidate) {
        // the campaign might be associated with public candidate, and we need to update it too. specifically - admin path to victory: voteGoal, voterProjection
        // find associate candidate first
        const { candidateSlug, pathToVictory } = campaign;
        if (candidateSlug && pathToVictory) {
          const candidate = await Candidate.findOne({ slug: candidateSlug });
          if (candidate) {
            const data = JSON.parse(candidate.data);
            await Candidate.updateOne({ slug: candidateSlug }).set({
              data: JSON.stringify({
                ...data,
                voteGoal: parseInt(pathToVictory.voteGoal) || 0,
                voterProjection: parseInt(pathToVictory.voterProjection) || 0,
                finalVotes: parseInt(pathToVictory.finalVotes) || false,
              }),
            });
          }
        }
      }

      await sails.helpers.crm.updateCampaign(updated);

      return exits.success({
        message: 'updated',
        // updated,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error updating hubspot company',
        e,
      );
      return exits.badRequest({ message: 'Error updating campaign.' });
    }
  },
};

async function updateUserPhone(campaign, user) {
  try {
    if (
      campaign?.details?.campaignPhone &&
      campaign?.details?.campaignPhone !== '' &&
      !user.phone
    ) {
      console.log('updating user with ', campaign.details.campaignPhone);
      await User.updateOne({ id: user.id }).set({
        phone: campaign.details.campaignPhone,
      });
    }
  } catch (e) {
    console.log('error at updateUserPhone', e);
  }
}

async function sendSlackMessage(campaign, user) {
  if (appBase !== 'https://goodparty.org') {
    return;
  }
  const { slug, details } = campaign;
  const { firstName, lastName, office, state, city, district } = details;
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
          \nName: ${firstName} ${lastName}
          \nOffice: ${office}
          \nState: ${state}
          \nCity: ${city || 'n/a'}
          \nDistrict: ${district || 'n/a'}
          \nemail: ${user.email}
          \nslug: ${slug}\n
          \nadmin link: ${appBase}/admin/victory-path/${slug}
          \n
          \n<@U01AY0VQFPE> and <@U03RY5HHYQ5>
          `,
        },
      },
    ],
  };

  await sails.helpers.slack.slackHelper(slackMessage, 'victory');
}
