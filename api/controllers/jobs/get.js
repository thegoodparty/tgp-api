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

      console.log('ashbyKey', ashbyKey);

      // Prepare the authentication credentials
      const authHeader =
        'Basic ' + Buffer.from(ashbyKey + ':').toString('base64');

      // Set up the fetch options
      const fetchOptions = {
        method: 'POST',
        body: JSON.stringify({ jobPostingId: id }),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
        },
      };

      console.log('fetchOptions', fetchOptions);

      try {
        // Make the POST request
        const response = await fetch(apiUrl, fetchOptions);
        console.log('response', response);
        // Handle the response
        if (response?.ok) {
          const jobsResponse = await response.json();
          console.log('jobsResponse', jobsResponse);
          if (jobsResponse && jobsResponse?.results) {
            job = jobsResponse.results;
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
