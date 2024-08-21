// https://developers.hubspot.com/docs/api/crm/companies
// private app logs: https://app.hubspot.com/private-apps/21589597/1641594/logs/api?id=9666b9d1-23c5-4ae4-8ca0-f9f91300a5a6
const hubspot = require('@hubspot/api-client');

const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;

const hubspotClient =
  hubSpotToken && new hubspot.Client({ accessToken: hubSpotToken });

module.exports = {
  hubspotClient,
};
