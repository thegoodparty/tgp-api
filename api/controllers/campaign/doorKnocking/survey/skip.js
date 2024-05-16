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

      const surveys = await Survey.find({
        route: route.id,
        dkCampaign: dkCampaign.id,
        campaign: dkCampaign.campaign,
        volunteer: route.volunteer.id,
        voter: voterId,
      });
      let survey;
      if (surveys.length === 0) {
        // skipping the voter no voter before a survey created
        survey = await Survey.create({
          route: route.id,
          dkCampaign: dkCampaign.id,
          data,
          campaign: dkCampaign.campaign,
          volunteer: route.volunteer.id,
          voter: voterId,
        }).fetch();
      } else {
        survey = surveys[0];
        await Survey.updateOne({ id: survey.id }).set({
          data: { ...survey.data, ...data, status: 'skipped' },
        });
      }

      const addresses = route.data.optimizedAddresses;
      let nextVoter = null;
      let isRouteCompleted = false;
      let completeCount = 0;
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        const surveys = await Survey.find({
          voter: address.voterId,
          route: route.id,
          volunteer: route.volunteer.id,
        });
        let survey;
        if (surveys.length > 0) {
          survey = surveys[0];
        }
        if (survey) {
          if (survey.data?.status === 'completed') {
            completeCount++;
          } else {
            if (address.voterId !== voterId) {
              nextVoter = address.voterId;
              break;
            }
          }
        } else {
          if (address.voterId !== voterId) {
            nextVoter = address.voterId;
            break;
          }
        }
      }
      if (completeCount === addresses.length) {
        isRouteCompleted = true;
      }

      return exits.success({
        nextVoter,
        isRouteCompleted,
      });
    } catch (e) {
      console.log('Error at doorKnocking/survey/skip', e);
      return exits.badRequest({ message: 'Error skipping survey.' });
    }
  },
};

const survey = {
  planningToVote: 'yes',
  heardOf: 'yes',
  issuesCareAbout: 'A big note about the issies',
  'political views': 'Libertarian',
  canFollow: 'yes',
  resolution: 'Refused to Engage',
  note: 'Test the note ',
  status: 'completed',
};
