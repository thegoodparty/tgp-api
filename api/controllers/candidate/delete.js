// admin delete
module.exports = {
  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
    notFound: {
      description: 'Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let { slug } = inputs;
      slug = slug.replace(/\//g, '-');

      const candidate = await BallotCandidate.updateOne({
        slug,
      }).set({
        isRemoved: true,
      });

      return exits.success({
        message: candidate ? 'Candidate deleted' : 'Candidate not found',
      });
    } catch (e) {
      console.log('Error in delete candidate', e);
      return exits.forbidden();
    }
  },
};
