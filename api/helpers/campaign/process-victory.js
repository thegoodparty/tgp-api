/* eslint-disable object-shorthand */
const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Success',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      // Process path to victory all Waiting campaigns.
      const campaigns = await sails.sendNativeQuery(`
        SELECT *
        FROM public.campaign
        WHERE data ->> 'p2vStatus' = 'Waiting'
        AND (data->'details'->>'raceId') IS NOT NULL
        AND (data->'details'->>'pledged') = 'true';
      `);

      await sails.helpers.queue.consumer();

      const rows = campaigns?.rows;
      console.log('rows', rows.length);
      for (const row of rows) {
        let campaign = await Campaign.findOne({
          id: row.id,
        });
        await sails.helpers.queue.enqueuePathToVictory(campaign);
      }

      return exits.success('ok');
    } catch (e) {
      console.log('error at process-victory', e);
      return exits.badRequest('error');
    }
  },
};
