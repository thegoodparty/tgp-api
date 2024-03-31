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

      await verifyVoterBelongsToCampaign(voterId, dkCampaign.campaign);

      const survey = await Survey.findOne({
        route: route.id,
        dkCampaign: dkCampaign.id,
        campaign: dkCampaign.campaign,
        volunteer: route.volunteer.id,
        voter: voterId,
      });
      if (!survey) {
        return exits.success(false);
      }

      return exits.success({
        survey: survey.data,
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
