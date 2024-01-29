/**
 * jobs/list.js
 *
 * @description :: Find all Asbhy Job listings.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const axios = require('axios');
const ashbyKey = sails.config.custom.ashbyKey || sails.config.ashbyKey;

module.exports = {
  friendlyName: 'Jobs list',

  description: 'Get job listings from Ashby',

  inputs: {},

  exits: {
    success: {
      description: 'Jobs Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Jobs Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    let jobs = [];
    try {
      const apiUrl = 'https://api.ashbyhq.com/jobPosting.list';
      try {
        const response = await axios.post(
          apiUrl,
          { listedOnly: true },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Basic ${Buffer.from(ashbyKey + ':').toString(
                'base64',
              )}`,
            },
          },
        );
        if (response?.data && response?.data?.results) {
          jobs = response.data.results;
        } else {
          console.error(
            'Failed to fetch data:',
            response.status,
            response.statusText,
          );
        }
      } catch (error) {
        console.error('Error during fetch:', error.message);
        return {
          notFound: true,
        };
      }

      return exits.success({
        jobs,
      });
    } catch (e) {
      console.log('Error in jobs list', e);
      return exits.notFound();
    }
  },
};
