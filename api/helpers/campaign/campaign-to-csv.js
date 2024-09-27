const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

module.exports = {
  friendlyName: 'campaign to csv',

  description: 'Export campaigns to CSV',

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

    const campaigns = await sails.sendNativeQuery(query);
    const rows = campaigns?.rows;
    console.log('rows', rows.length);
    for (const row of rows) {
      let campaign = await Campaign.findOne({
        id: row.id,
      });
      const { slug, details, data } = campaign;

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
      const incumbent = data?.hubSpotUpdates?.incumbent || '';
      const opponents = data?.hubSpotUpdates?.opponents || '';

      csvData.push({
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
    }

    const csvPath = path.join(__dirname, 'GP-Candidates.csv');
    console.log(`Generating CSV at ${csvPath}`);
    const csv = parse(csvData);
    fs.writeFileSync(csvPath, csv);
    console.log(`CSV generated at ${csvPath}`);

    return exits.success({
      message: 'ok',
    });
  },
};
