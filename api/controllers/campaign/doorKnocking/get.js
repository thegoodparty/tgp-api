// create campaignVolunteer via accepting VolunteerInvitation
module.exports = {
  inputs: {
    slug: {
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
      const user = this.req.user;
      const { slug } = inputs;

      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      const dkCampaign = await DoorKnockingCampaign.findOne({
        slug,
        campaign: campaign.id,
      }).populate('routes', {
        where: { status: { '!=': 'not-calculated' } },
      });

      if (!dkCampaign) {
        return exits.badRequest('No campaign');
      }

      let totals = {
        completed: 0,
        skipped: 0,
        refusal: 0,
        likelyVoters: 0,
        positiveExperience: 0,
        totalAddresses: 0,
      };
      for (let i = 0; i < dkCampaign.routes.length; i++) {
        const route = dkCampaign.routes[i];
        if (!route || !route.data || !route.data.optimizedAddresses) {
          continue;
        }
        totals.totalAddresses += route.data.optimizedAddresses.length;

        const { route: updatedRoute } =
          await sails.helpers.doorKnocking.routeStatus(route, true);
        if (updatedRoute.data.totals) {
          totals.completed += updatedRoute.data.totals.completed;
          totals.skipped += updatedRoute.data.totals.skipped;
          totals.refusal += updatedRoute.data.totals.refusal;
          totals.likelyVoters += updatedRoute.data.totals.likelyVoters;
          totals.positiveExperience +=
            updatedRoute.data.totals.positiveExperience;
        }
      }
      return exits.success({
        dkCampaign: dkCampaign.data,
        routes: dkCampaign.routes,
        totals,
      });
    } catch (e) {
      console.log('Error at doorKnocking/create', e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
