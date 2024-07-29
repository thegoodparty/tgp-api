const handlePathToVictory = require('../api/utils/campaign/handlePathToVictory');
const getRaceDetails = require('../api/utils/campaign/getRaceDetails');

module.exports = {
  friendlyName: 'Fix p2v',

  description: 'Find electionLocation for failed p2vs.',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const p2vs = await sails.sendNativeQuery(`
        select *
        from public.campaign as c
        inner join public.pathtovictory as pathtovictory on c.id = pathtovictory.campaign
        where c.details->>'pledged'='true'
        and (c.details->>'runForOffice'='yes' or c.details->>'knowRun'='true')
        and c.details->>'electionDate' is not null
        and c.details->>'raceId' is not null
        and (pathtovictory.data->>'p2vStatus'='Complete')
        and (pathtovictory.data->>'p2vNotNeeded' is null or pathtovictory.data->>'p2vNotNeeded'='false')
        and (pathtovictory.data->>'electionLocation' is null or pathtovictory.data->>'electionLocation'='')
        order by c.id desc;
    `);
    // const p2vs = await sails.sendNativeQuery(`
    //   select *
    //   from public.campaign as c
    //   where c.details->>'raceId' is not null
    //   order by c.id desc LIMIT 1;
    // `);
    const rows = p2vs?.rows;
    console.log('rows', rows.length);
    for (const row of rows) {
      let campaignId = row.campaign;
      await runP2V(campaignId);
    }
    return exits.success({
      message: 'ok',
    });
  },
};

async function runP2V(campaignId) {
  const campaign = await Campaign.findOne({ id: campaignId }).populate(
    'pathToVictory',
  );
  const { slug, details } = campaign;
  const data = await getRaceDetails(details.raceId, slug, details.zip, false);
  data.campaignId = campaignId;
  sails.helpers.log(slug, 'data', data);
  const { pathToVictoryResponse } = await handlePathToVictory({ ...data });
  sails.helpers.log(slug, 'pathToVictoryResponse', pathToVictoryResponse);

  if (
    pathToVictoryResponse &&
    pathToVictoryResponse.electionLocation &&
    pathToVictoryResponse.electionLocation !== '' &&
    pathToVictoryResponse?.counts?.total &&
    pathToVictoryResponse.counts.total > 0
  ) {
    sails.helpers.log(
      slug,
      'setting electionLocation',
      pathToVictoryResponse.electionLocation,
    );
    await PathToVictory.updateOne({ campaign: campaignId }).set({
      data: {
        ...campaign.pathToVictory.data,
        electionType: pathToVictoryResponse.electionType,
        electionLocation: pathToVictoryResponse.electionLocation,
      },
    });
  }
}
