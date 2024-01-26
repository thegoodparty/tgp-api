/**
 * jobs/list.js
 *
 * @description :: Find all Asbhy Job listings.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

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

      // Prepare the authentication credentials
      const authHeader =
        'Basic ' + Buffer.from(ashbyKey + ':').toString('base64');

      // Set up the fetch options
      const fetchOptions = {
        method: 'POST',
        body: JSON.stringify({ listedOnly: true }),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
        },
      };

      try {
        // Make the POST request
        const response = await fetch(apiUrl, fetchOptions);
        console.log('response', response);
        // Handle the response
        if (response?.ok) {
          const jobsResponse = await response.json();
          console.log('jobsResponse', jobsResponse);
          if (jobsResponse && jobsResponse?.results) {
            jobs = jobsResponse.results;
            // jobs = jobs.filter((job) => job.status === 'Open');
          } else {
            console.error(
              'Failed to fetch data:',
              response.status,
              response.statusText,
            );
          }
        }
      } catch (error) {
        console.error('Error during fetch:', error.message);
        return {
          notFound: true,
        };
      }

      console.log('jobs', jobs);

      return exits.success({
        jobs,
      });
    } catch (e) {
      console.log('Error in jobs list', e);
      return exits.notFound();
    }
  },
};
