const axios = require('axios');
const ashbyKey = sails.config.custom.ashbyKey || sails.config.ashbyKey;

module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'found',
    },

    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },

    notFound: {
      description: 'Not Found',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { id } = inputs;
      let job;
      const apiUrl = 'https://api.ashbyhq.com/jobPosting.info';

      try {
        const response = await axios.post(
          apiUrl,
          { jobPostingId: id },
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
          job = response.data.results;
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
        job,
      });
    } catch (e) {
      console.log('error at jobs/get', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
