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

      await verifyVoterBelongsToCampaign(voterId, dkCampaign.campaign);

      let survey = await Survey.findOne({
        route: route.id,
        dkCampaign: dkCampaign.id,
        campaign: dkCampaign.campaign,
        volunteer: route.volunteer.id,
        type: dkCampaign.type,
        voter: voterId,
      });

      if (!survey) {
        // skipping the voter no voter before a survey created
        survey = await Survey.create({
          route: route.id,
          dkCampaign: dkCampaign.id,
          data,
          campaign: dkCampaign.campaign,
          volunteer: route.volunteer.id,
          type: dkCampaign.type,
          voter: voterId,
        }).fetch();
      }

      await Survey.updateOne({ id: survey.id }).set({
        data: { ...survey.data, ...data, status: 'skipped' },
      });

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
      console.log('Error at doorKnocking/survey/create', e);
      return exits.badRequest({ message: 'Error creating survey.' });
    }
  },
};

async function verifyVoterBelongsToCampaign(voterId, campaignId) {
  try {
    // I am using a raw query since I don't want to load all the voters and iterate over them
    const rawQuery = `
      SELECT EXISTS(
        SELECT 1
        FROM campaign_voters__voter_campaigns as cv
        WHERE cv.campaign_voters = $1 AND cv.voter_campaigns = $2
      ) as "exists";
    `;

    const result = await sails
      .getDatastore()
      .sendNativeQuery(rawQuery, [campaignId, voterId]);

    // Depending on the database used and the Sails version, you might need to adjust
    // how you access the query result. This is a typical way for PostgreSQL.
    const exists = result.rows[0].exists;

    return exists;
  } catch (e) {
    console.log('Error verifying voter belongs to campaign.', e);
    return false;
  }
}
