module.exports = {
  inputs: {
    routeId: {
      type: 'number',
      required: true,
    },
    voterId: {
      type: 'number',
      required: true,
    },
    data: {
      type: 'json',
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
      const { routeId, voterId, data } = inputs;

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

      const survey = await Survey.findOne({
        route: route.id,
        dkCampaign: dkCampaign.id,
        campaign: dkCampaign.campaign,
        volunteer: route.volunteer.id,
        type: dkCampaign.type,
        voter: voterId,
      });

      await Survey.updateOne({ id: survey.id }).set({
        data: { ...survey.data, ...data, status: 'completed' },
      });

      // update route to complete of all addresses are completed
      const addresses = route.data.optimizedAddresses;
      let nextVoter = null;
      let isRouteCompleted = false;
      let completeCount = 0;
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        const survey = await Survey.findOne({
          voter: address.voterId,
          route: route.id,
          volunteer: route.volunteer.id,
        });
        if (survey) {
          if (
            survey.data?.status === 'completed' ||
            survey.data?.status === 'skipped'
          ) {
            completeCount++;
          } else {
            nextVoter = address.voterId;
            break;
          }
        } else {
          nextVoter = address.voterId;
          break;
        }
      }
      if (completeCount === addresses.length) {
        await DoorKnockingRoute.updateOne({ id }).set({
          status: 'completed',
        });
        isRouteCompleted = true;
      } else {
        await DoorKnockingRoute.updateOne({ id: route.id }).set({
          status: 'in-progress',
        });
      }

      return exits.success({
        nextVoter,
        isRouteCompleted,
      });
    } catch (e) {
      console.log('Error at doorKnocking/survey/complete', e);
      return exits.badRequest({ message: 'Error completing survey.' });
    }
  },
};
