const getGenderCounts = require('../../utils/voter/getGenderCounts');
const getEthnicityCounts = require('../../utils/voter/getEthnicityCounts');

module.exports = {
  inputs: {
    limit: {
      type: 'number',
      defaultsTo: 0,
    },
    start: {
      type: 'number',
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
      const { limit, start } = inputs;

      // Update path to victory with gender and ethnicity data
      let query = `
      select c.id, c.details, pathtovictory.data, pathtovictory.campaign
      from public.campaign as c
      inner join public.pathtovictory as pathtovictory on c.id = pathtovictory.campaign
      where c.details->>'pledged'='true'
      and (c.details->>'runForOffice'='yes' or c.details->>'knowRun'='true')
      and c.details->>'electionDate' is not null
      and c.details->>'raceId' is not null
      and pathtovictory.data->>'projectedTurnout' is not null
      and pathtovictory.data->>'electionType' is not null
      and pathtovictory.data->>'men' is null`;
      if (start) {
        query += ` and c.id < ${start}`;
      }
      query += ` order by c.id desc`;
      if (limit > 0) {
        query += ` limit ${limit};`;
      }

      console.log('query', query);

      const campaigns = await sails.sendNativeQuery(query);
      const rows = campaigns?.rows;
      console.log('rows', rows.length);
      let i = 0;
      for (const row of rows) {
        i++;
        let campaign = await Campaign.findOne({
          id: row.id,
        }).populate('pathToVictory');
        const campaignId = campaign?.id;
        if (!campaignId) {
          console.log('campaignId not found');
          continue;
        }

        const electionState = campaign?.details?.state;
        const electionType = campaign?.pathToVictory?.data?.electionType;
        const electionLocation =
          campaign?.pathToVictory?.data?.electionLocation;
        if (!electionState || !electionType || !electionLocation) {
          console.log(
            `missing data for campaign ${campaignId}. electionState: ${electionState}, electionType: ${electionType}, electionLocation: ${electionLocation}`,
          );
          continue;
        }

        // sleep for 6 seconds
        await new Promise((resolve) => setTimeout(resolve, 6000));
        console.log(
          `Processing campaign ${i} of ${rows.length} with id ${campaignId}`,
        );

        let searchJson = {
          filters: {},
        };

        if (electionType && electionType !== '') {
          searchJson.filters[electionType] = electionLocation;
        }

        const genderCounts = await getGenderCounts(electionState, searchJson);
        console.log('genderCounts', genderCounts);

        // sleep for 6 seconds
        await new Promise((resolve) => setTimeout(resolve, 6000));

        const ethnicityCounts = await getEthnicityCounts(
          electionState,
          searchJson,
        );
        console.log('ethnicityCounts', ethnicityCounts);

        if (
          genderCounts?.men &&
          genderCounts.men > 0 &&
          ethnicityCounts?.white &&
          ethnicityCounts.white > 0
        ) {
          console.log('updating campaign', campaignId);
          const pathToVictoryData = campaign.pathToVictory.data;
          await PathToVictory.updateOne({
            campaign: campaignId,
          }).set({
            data: {
              ...pathToVictoryData,
              ...genderCounts,
              ...ethnicityCounts,
            },
          });
        }
      }

      return exits.success('ok');
    } catch (e) {
      console.log('error at process-details', e);
      return exits.badRequest('error');
    }
  },
};
