module.exports = {
  friendlyName: 'Seed position tier data',

  description:
    'Seed position tier data for any campaign that has a raceId but no tier',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const response = await sails.sendNativeQuery(
      `select id from public.campaign where details->>'raceId' IS NOT NULL and details->>'tier' IS NULL`,
    );
    const rows = response?.rows;
    if (!rows && rows.length === 0) {
      return exits.success({
        message: 'No rows found',
      });
    }

    let total = 0;
    let success = 0;
    for (const row of rows) {
      const campaignId = row.id;
      try {
        const campaign = await Campaign.findOne({
          id: campaignId,
        });
        if (!campaign) {
          console.log(`error finding campaign with id ${campaignId}`);
          continue;
        }
        total++;
        const raceId = campaign.details.raceId;
        if (!raceId) {
          console.log(`campaign id ${id} has no raceId`);
          continue;
        }

        const race = await sails.helpers.ballotready.getRace(raceId);
        const tier = race?.position?.tier;
        if (tier) {
          success++;
          console.log(
            `raceId ${raceId} has tier ${tier}. success: ${success}/${total}`,
          );
          await Campaign.updateOne({ id: campaignId }).set({
            details: { ...campaign.details, tier },
          });
        } else {
          console.log(`could not find tier for raceId ${raceId}`);
        }
      } catch (e) {
        console.log('error', e);
      }
    }

    console.log('all done');

    return exits.success({
      message: total,
    });
  },
};
