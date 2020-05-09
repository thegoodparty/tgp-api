const request = require('request-promise');

module.exports = {
  friendlyName: 'Scrape webhook',

  description: 'webhook called from webscraper.io',

  inputs: {
    scrapingjob_id: {
      description: 'Scrape Job Id',
      example: 1234,
      required: true,
      type: 'number',
    },
    sitemap_name: {
      description: 'Sitemap nape',
      example: 'presidential-race',
      required: true,
      type: 'string',
    },
    status: {
      description: 'Scraping status',
      example: 'finished',
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Web hook Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const jobId = inputs.scrapingjob_id;
      const sitemapName = inputs.sitemap_name;
      const { status } = inputs;
      console.log(
        `scrape webhook. jobId: ${jobId}. Sitemap name: ${sitemapName}. Status: ${status}`,
      );
      const token =
        sails.config.custom.webScraperApiToken ||
        sails.config.webScraperApiToken;

      const fileType = 'json';

      if (status === 'finished' || status === 'shelved') {
        const downloadLink = `https://api.webscraper.io/api/v1/scraping-job/${jobId}/${fileType}?api_token=${token}`;
        console.log('getting file from web scraper');
        const binaryFile = await request(downloadLink);

        const data = {
          Key: `${sitemapName}.txt`,
          Body: binaryFile,
        };
        console.log('uploading to s3...');
        await sails.helpers.s3Uploader(data, 'scrape.thegoodparty.org');
        console.log('upload complete');
        const devBase = 'https://api-dev.thegoodparty.org/api/v1';
        if (sitemapName === 'presidential-race') {
          console.log('scrape: running presidential seed');
          request(`${devBase}/seed/seed-presidential`);
        } else if (sitemapName === 'races-combined') {
          console.log('scrape: running races seed');
          request(`${devBase}/seed/seed-races-combined`);
        } else if (sitemapName === 'incumbents') {
          console.log('scrape: running incumbents seed');
          request(`${devBase}/seed/seed-incumbents`);
        } else if (sitemapName === 'ballotpedia') {
          console.log('scrape: running ballotpedia seed');
          request(`${devBase}/seed/seed-ballotpedia`);
        }
        return exits.success({ message: 'ok' });
      }
    } catch (e) {
      console.log(e);
    }
  },
};
