const getGenderCounts = require('../../utils/voter/getGenderCounts');
const getEthnicityCounts = require('../../utils/voter/getEthnicityCounts');

module.exports = {
  inputs: {
    limit: {
      type: 'number',
      defaultsTo: 0,
    },
  },

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
      const { limit } = inputs;

      // Update path to victory with gender and ethnicity data
      let query = `
      select *
      from public.campaign as c
      inner join public.pathtovictory as pathtovictory on c.id = pathtovictory.campaign
      where c.details->>'pledged'='true'
      and (c.details->>'runForOffice'='yes' or c.details->>'knowRun'='true')
      and c.details->>'electionDate' is not null
      and c.details->>'raceId' is not null
      and pathtovictory.data->>'total' is not null
      and pathtovictory.data->>'total' > 0
      and pathtovictory.data->>'electionType' is not null
      and pathtovictory.data->>'men' is null
      order by c.id desc`;
      if (limit > 0) {
        query += ` limit ${limit};`;
      }

      console.log('query', query);

      const campaigns = await sails.sendNativeQuery(query);
      const rows = campaigns?.rows;
      console.log('rows', rows.length);
      for (const row of rows) {
        let campaign = await Campaign.findOne({
          id: row.id,
        });
        const campaignId = campaign.id;

        const genderCounts = await getGenderCounts(campaignId);
        const ethnicityCounts = await getEthnicityCounts(campaignId);

        console.log('data', data);

        const pathToVictory = await PathToVictory.findOne({
          campaign: campaignId,
        });
        const pathToVictoryData = pathToVictory.data;

        await Pathtovictory.updateOne({
          campaign: campaignId,
        }).set({
          data: {
            ...pathToVictoryData,
            ...genderCounts,
            ...ethnicityCounts,
          },
        });
      }

      return exits.success('ok');
    } catch (e) {
      console.log('error at process-details', e);
      return exits.badRequest('error');
    }
  },
};
