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
      from public.campaign as c
      inner join public.pathtovictory as pathtovictory on c.id = pathtovictory.campaign
      where c.details->>'pledged'='true'
      and (c.details->>'runForOffice'='yes' or c.details->>'knowRun'='true')
      and c.details->>'electionDate' is not null
      and c.details->>'raceId' is not null
      and pathtovictory.data->>'totalRegisteredVoters' is null
      and pathtovictory.data->>'p2vNotNeeded' is null
      order by c.id desc;
      `);

      await sails.helpers.queue.consumer();

      const rows = campaigns?.rows;
      console.log('rows', rows.length);
      for (const row of rows) {
        console.log('campaign', row.campaign);
        await sails.helpers.queue.enqueuePathToVictory(row.campaign);
      }

      return exits.success('ok');
    } catch (e) {
      console.log('error at process-victory', e);
      return exits.badRequest('error');
    }
  },
};
