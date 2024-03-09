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
      select *
      from public.campaign
      where (data->>'p2vStatus'='Waiting' OR data->>'p2vStatus' is null)
      and data->'details'->>'pledged'='true'
      and (data->'details'->>'runForOffice'='yes' or data->'details'->>'knowRun'='true')
      and data->'details'->>'electionDate' is not null
      and data->>'p2vNotNeeded' is null
      and data->'details'->>'raceId' is not null
      order by id desc;
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
