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

          if (!details?.officeTermLength && data?.electionTerm) {
            details.officeTermLength = data?.electionTerm;
          }
          if (!details?.electionDate && data?.electionDate) {
            details.electionDate = data?.electionDate;
          }
          if (!details?.level && data?.electionLevel) {
            details.level = data?.electionLevel;
          }
          if (!details?.state && data?.electionState) {
            details.state = data?.electionState;
          }
          if (!details?.county && data?.electionCounty) {
            details.county = data?.electionCounty;
          }
          if (!details?.city && data?.electionMunicipality) {
            details.city = data?.electionMunicipality;
          }
          if (!details?.district && data?.subAreaValue) {
            details.district = data?.subAreaValue;
          }
          if (!details?.partisanType && data?.partisanType) {
            details.partisanType = data?.partisanType;
          }
          if (!details?.priorElectionDates && data?.priorElectionDates) {
            details.priorElectionDates = data?.priorElectionDates;
          }
          if (!details?.positionId && data?.positionId) {
            details.positionId = data?.positionId;
          }
          if (!details?.tier && data?.tier) {
            details.tier = data?.tier;
          }

          // update the Campaign details
          if (details) {
            await Campaign.updateOne({ id: campaign.id }).set({
              details,
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
