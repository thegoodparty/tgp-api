const slugify = require('slugify');

module.exports = {
  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    type: {
      type: 'string',
      required: true,
    },
    minHousesPerRoute: {
      type: 'number',
      required: true,
    },
    maxHousesPerRoute: {
      type: 'number',
      required: true,
    },

    startDate: {
      type: 'string',
      required: true,
    },
    endDate: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const {
        name,
        type,
        minHousesPerRoute,
        maxHousesPerRoute,
        startDate,
        endDate,
      } = inputs;
      await sails.helpers.queue.consumer();

      const user = this.req.user;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      if (!campaign.data.hasVoterFile) {
        return exits.badRequest('No voter file');
      }

      const randomString = generateRandomString(5);

      const slug = `${campaign.slug}-${slugify(startDate, {
        lower: true,
      })}-${slugify(randomString, { lower: true })}`;
      const dkCampaign = await DoorKnockingCampaign.create({
        slug,
        data: {
          name,
          type,
          minHousesPerRoute,
          maxHousesPerRoute,
          startDate,
          endDate,
          slug,
        },
        campaign: campaign.id,
      }).fetch();

      const queueMessage = {
        type: 'calculateDkRoutes',
        data: {
          campaignId: campaign.id,
          dkCampaignId: dkCampaign.id,
          minHousesPerRoute,
          maxHousesPerRoute,
        },
      };

      await sails.helpers.queue.enqueue(queueMessage);

      return exits.success({
        slug,
      });
    } catch (e) {
      console.log('Error at doorKnocking/create', e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};

function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
