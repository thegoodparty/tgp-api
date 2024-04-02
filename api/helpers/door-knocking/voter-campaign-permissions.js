module.exports = {
  inputs: {
    voterId: {
      type: 'number',
      required: true,
    },
    campaignId: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { voterId, campaignId } = inputs;
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

      return exits.success(exists);
    } catch (e) {
      console.log('Error verifying voter belongs to campaign.', e);
      return exits.success(false);
    }
  },
};
