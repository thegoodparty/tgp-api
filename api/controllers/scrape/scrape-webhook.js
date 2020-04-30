const request = require('request-promise');
const fs = require('fs');
const path = require('path');

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

      if (status === 'finished') {
        const downloadLink = `https://api.webscraper.io/api/v1/scraping-job/${jobId}/csv?api_token=${token}`;
        const options = {
          uri: downloadLink,
          method: 'GET',
        };

        const csvFile = await request(options);
        console.log(csvFile);
        const filename = path.join(
          __dirname,
          `../../../data/${sitemapName}.csv`,
        );
        const writeStream = fs.createWriteStream(filename);
        writeStream.write(csvFile, 'binary');
        writeStream.on('finish', () => {
          console.log('wrote all data to file');
        });
        writeStream.end();
        const base = 'https://api-dev.thegoodparty.org/api/v1';
        if (sitemapName === 'presidential-race') {
          console.log('scrape: running presidential seed');
          request(`${base}/seed/seed-presidential`);
        } else if (sitemapName === 'races-combined') {
          console.log('scrape: running races seed');
          request(`${base}/seed/seed-races-combined`);
        } else if (sitemapName === 'incumbents') {
          console.log('scrape: running incumbents seed');
          request(`${base}/seed/seed-incumbents`);
        } else if (sitemapName === 'ballotpedia') {
          console.log('scrape: running ballotpedia seed');
          request(`${base}/seed/seed-ballotpedia`);
        }
        return exits.success({ message: 'ok' });
      }
    } catch (e) {
      console.log(e);
    }
  },
};
