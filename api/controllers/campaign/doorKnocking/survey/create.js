module.exports = {
  inputs: {
    data: {
      type: 'json',
      required: true,
    },
    routeId: {
      type: 'number',
      required: true,
    },
    voterId: {
      type: 'number',
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
      const { data, routeId, voterId } = inputs;

      const user = this.req.user;
      const route = await DoorKnockingRoute.findOne({ id: routeId }).populate(
        'volunteer',
      );

      if (route.volunteer.user !== user.id) {
        return exits.badRequest('Not your route');
      }

      const dkCampaign = await DoorKnockingCampaign.findOne({
        id: route.dkCampaign,
      });

      const belongs = await sails.helpers.doorKnocking.voterCampaignPermissions(
        voterId,
        dkCampaign.campaign,
      );
      if (!belongs) {
        return exits.badRequest('Voter does not belong to campaign');
      }

      const survey = await Survey.findOrCreate(
        {
          route: route.id,
          dkCampaign: dkCampaign.id,
          campaign: dkCampaign.campaign,
          volunteer: route.volunteer.id,
          type: dkCampaign.type,
          voter: voterId,
        },
        {
          route: route.id,
          dkCampaign: dkCampaign.id,
          data,
          campaign: dkCampaign.campaign,
          volunteer: route.volunteer.id,
          type: dkCampaign.type,
          voter: voterId,
        },
      );

      const updatedData = {
        ...survey.data,
        ...data,
      };

      // update data in case it was already created
      await Survey.updateOne({ id: survey.id }).set({
        data: updatedData,
      });

      if (route.status !== 'in-progress') {
        await DoorKnockingRoute.updateOne({ id: route.id }).set({
          status: 'in-progress',
        });
      }

      return exits.success({
        survey: updatedData,
      });
    } catch (e) {
      console.log('Error at doorKnocking/survey/create', e);
      return exits.badRequest({ message: 'Error creating survey.' });
    }
  },
};
