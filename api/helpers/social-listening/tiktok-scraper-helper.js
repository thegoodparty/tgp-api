// https://app.abstractapi.com/dashboard
const axios = require('axios');

const scrapeApi = sails.config.custom.scrapeApi || sails.config.scrapeApi;

module.exports = {
  friendlyName: 'Pulsar GraphQl helper',

  description:
    'https://doc.pulsarplatform.com/pulsar-documentation/graphql/data-explorer',

  inputs: {
    url: {
      type: 'string',
      required: true,
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { url } = inputs;

      const res = await axios.get(
        `https://scrape.abstractapi.com/v1/?api_key=${scrapeApi}&url=${url}`,
      );

      const html = res.data;

      const followers = html.substring(
        html.indexOf('Likes. ') + 7,
        html.indexOf('Followers.') - 1,
      );

      console.log('followers', followers);
      console.log('getval', getVal(followers));

      return exits.success({
        followers: getVal(followers),
      });
    } catch (e) {
      console.log('error at helpers/socialListening/tiktok-scraper');
      throw e;
    }
  },
};

// converts 30.6 to 36000
function getVal(val) {
  const multiplier = val.substr(-1).toLowerCase();
  console.log(multiplier);
  if (multiplier === 'k') {
    return parseFloat(val) * 1000;
  }
  if (multiplier === 'm') {
    return parseFloat(val) * 1000000;
  }

  return parseFloat(val);
}
