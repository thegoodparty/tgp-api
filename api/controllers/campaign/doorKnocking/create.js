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
    housesPerRoute: {
      type: 'number',
      required: true,
    },
    minutesPerHouse: {
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
        housesPerRoute,
        minutesPerHouse,
        startDate,
        endDate,
      } = inputs;
      await sails.helpers.queue.consumer();

      const user = this.req.user;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      if (!campaign.hasVoterFile) {
        return exits.badRequest('No voter file');
      }

      const slug = `${campaign.slug}-${slugify(startDate, { lower: true })}`;
      await DoorKnockingCampaign.create({
        slug,
        data: {
          name,
          type,
          housesPerRoute,
          minutesPerHouse,
          startDate,
          endDate,
          slug,
        },
        campaign: campaign.id,
      }).fetch();

      // const queueMessage = {
      //   type: 'calculateDkRoutes',
      //   data: {
      //     campaignId: campaign.id,
      //     minHousesPerRoute,
      //     maxHousesPerRoute,
      //   },
      // };

      // await sails.helpers.queue.enqueue(queueMessage);

      return exits.success({
        slug,
      });
    } catch (e) {
      console.log('Error at doorKnocking/create', e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
