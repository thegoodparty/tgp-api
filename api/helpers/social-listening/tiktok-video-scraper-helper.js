// https://app.abstractapi.com/dashboard
const axios = require('axios');
const cheerio = require('cheerio');

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
        `https://scrape.abstractapi.com/v1/?api_key=${scrapeApi}&url=${url}&render_js=true`,
      );

      const html = res.data;
      const $ = cheerio.load(html, null, false);
      const videos = $('video');
      if (videos.length > 0) {
        return exits.success(videos[0].attribs.src);
      }
      return exits.success();
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
