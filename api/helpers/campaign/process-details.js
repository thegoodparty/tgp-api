const getRaceDetails = require('../../utils/campaign/getRaceDetails');

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

      // Update city/county/election date details for campaigns using the latest data from BallotReady
      let query = `
      select *
      from public.campaign
      where details->>'pledged'='true'
      and (details->>'runForOffice'='yes' or details->>'knowRun'='true')
      and details->>'electionDate' is not null
      and details->>'raceId' is not null
      order by id desc;
      `;
      if (limit > 0) {
        query += ` limit ${limit}`;
      }

      const campaigns = await sails.sendNativeQuery(query);
      const rows = campaigns?.rows;
      console.log('rows', rows.length);
      for (const row of rows) {
        let campaign = await Campaign.findOne({
          id: row.id,
        });
        const campaignId = campaign.id;

        const { slug, details } = campaign;

        if (details?.raceId) {
          let raceId = details.raceId;
          sails.helpers.log(
            slug,
            `getting race details campaignId ${campaignId} raceId ${raceId} zip ${details.zip}`,
          );
          const data = await getRaceDetails(raceId, slug, details.zip);
          if (!data) {
            await sails.helpers.slack.slackHelper(
              { title: 'Error', body: `Failed to get race data for ${slug}` },
              'dev',
            );
            continue;
          }
          sails.helpers.log(slug, 'race data', data);

          // update the Campaign details
          if (details) {
            await Campaign.updateOne({ id: campaign.id }).set({
              details: {
                ...details,
                officeTermLength:
                  data?.electionTerm ?? details.officeTermLength,
                electionDate: data?.electionDate ?? details.electionDate,
                level: data?.electionLevel ?? details.level,
                state: data?.electionState ?? details.state,
                county: data?.electionCounty ?? details.county,
                city: data?.electionMunicipality ?? details.city,
                district: data?.subAreaValue ?? details.district,
                partisanType: data?.partisanType ?? details.partisanType,
                priorElectionDates:
                  data?.priorElectionDates ?? details.priorElectionDates,
                positionId: data?.positionId ?? details.positionId,
                tier: data?.tier ?? details.tier,
              },
            });
          }
        }
      }

      return exits.success('ok');
    } catch (e) {
      console.log('error at process-details', e);
      return exits.badRequest('error');
    }
  },
};
