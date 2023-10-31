/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

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
        console.log('no inputValues found on key', versionKey);
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
