const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

module.exports = {
  friendlyName: 'goodparty candidates - 1campaign-to-csv',

  description: 'Export goodparty campaigns to CSV',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    let csvData = [];

    // Update city/county/election date details for campaigns using the latest data from BallotReady
    let query = `
      select *
      from public.campaign
      where details->>'pledged'='true'
      and "isVerified"='true'
      and "isActive"='true'
      and details->>'electionDate' is not null
      and details->>'electionDate' != ''
      and (details->>'electionDate')::date > '2024-09-27';`;
    console.log('query', query);

    // const slugs = [...]

    const campaigns = await sails.sendNativeQuery(query);
    const rows = campaigns?.rows;
    console.log('rows', rows.length);
    for (const row of rows) {
      const slug = row.slug;
      // if (slugs.includes(slug)) {
      //   continue;
      // }

      let campaign = row;
      const { details, data } = campaign;
      console.log(`processing ${slug}`);
      let campaignId = campaign.id;

      const user = await User.findOne({ id: campaign.user });
      const firstName = user?.firstName || '';
      const lastName = user?.lastName || '';

      let office = '';
      if (details?.office && details.office !== '') {
        office = details.office;
      }
      if (details?.otherOffice && details.otherOffice !== '') {
        office = details?.otherOffice || '';
      }
      let raceId = '';
      if (details?.raceId && details.raceId !== '') {
        raceId = details.raceId;
      }
      const city = details?.city || '';
      const county = details?.county || '';
      const party = details?.party || '';
      const state = details?.state || '';
      const phone = details?.phone || '';
      const level = details?.ballotLevel || '';

      let website = '';
      if (details?.campaignWebsite && details.campaignWebsite !== '') {
        website = details.campaignWebsite;
      }
      if (
        data?.profile?.campaignWebsite &&
        data.profile.campaignWebsite !== ''
      ) {
        website = data.profile.campaignWebsite;
      }

      const electionDate = details?.electionDate || '';

      // Get data from hubspot
      let incumbent = data?.hubSpotUpdates?.incumbent || '';
      let opponents = data?.hubSpotUpdates?.opponents || '';

      // Get data from pathtovictory.viability
      const pathToVictoryId = campaign?.pathToVictory;
      if (pathToVictoryId) {
        const pathToVictory = await PathToVictory.findOne({
          id: pathToVictoryId,
        });
        if (pathToVictory) {
          const viability = pathToVictory?.data?.viability || {};
          if (viability) {
            let { isIncumbent, candidates } = viability;
            if (
              (!incumbent || incumbent === '') &&
              isIncumbent &&
              isIncumbent === true
            ) {
              incumbent = 'Yes';
            }
            if (
              (!opponents || opponents === '') &&
              candidates &&
              candidates > 0
            ) {
              opponents = candidates - 1;
            }
          }
        }
      }

      // if (!incumbent || incumbent === '' || !opponents || opponents === '') {
      // if (incumbent && incumbent !== '' && opponents && opponents !== '') {
      csvData.push({
        campaignId,
        raceId,
        slug,
        firstName,
        lastName,
        office,
        level,
        city,
        county,
        party,
        state,
        phone,
        website,
        electionDate,
        incumbent,
        opponents,
      });
      // } else {
      //   console.log(`skipping ${slug}`);
      // }
    }

    const csvPath = path.join(__dirname, 'GP-Candidates2.csv');
    console.log(`Generating CSV at ${csvPath}`);
    const csv = parse(csvData);
    fs.writeFileSync(csvPath, csv);
    console.log(`CSV generated at ${csvPath}`);

    return exits.success({
      message: 'ok',
    });
  },
};
