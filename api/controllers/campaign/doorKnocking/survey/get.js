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
      const { routeId, voterId } = inputs;

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

      const surveys = await Survey.find({
        route: route.id,
        dkCampaign: dkCampaign.id,
        campaign: dkCampaign.campaign,
        volunteer: route.volunteer.id,
        voter: voterId,
      });
      const survey = surveys.length > 0 ? surveys[0] : null;
      if (!survey) {
        return exits.success(false);
      }

      return exits.success({
        survey: survey.data,
      });
    } catch (e) {
      console.log('Error at doorKnocking/survey/get', e);
      return exits.badRequest({ message: 'Error getting survey.' });
    }
  },
};
