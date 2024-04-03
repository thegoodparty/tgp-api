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

      if (route.status !== 'in-progress') {
        await DoorKnockingRoute.updateOne({ id: route.id }).set({
          status: 'in-progress',
        });
      }

      // findOrCreate failed here since somehow we had more than one survey for the same voter
      let survey;
      const surveys = await Survey.find({
        route: route.id,
        dkCampaign: dkCampaign.id,
        campaign: dkCampaign.campaign,
        volunteer: route.volunteer.id,
        voter: voterId,
      });

      if (surveys.length > 0) {
        survey = surveys[0];
        const updatedData = {
          ...survey.data,
          ...data,
        };

        // update data in case it was already created
        await Survey.updateOne({ id: survey.id }).set({
          data: updatedData,
        });

        return exits.success({
          survey: updatedData,
        });
      } else {
        survey = await Survey.create({
          route: route.id,
          dkCampaign: dkCampaign.id,
          campaign: dkCampaign.campaign,
          volunteer: route.volunteer.id,
          voter: voterId,
          data,
        }).fetch();

        return exits.success({
          survey: data,
        });
      }
    } catch (e) {
      console.log('Error at doorKnocking/survey/create', e);
      return exits.badRequest({ message: 'Error creating survey.' });
    }
  },
};
