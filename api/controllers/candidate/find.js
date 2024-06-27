module.exports = {
  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    office: {
      type: 'string',
      required: true,
    },
    bustCache: {
      type: 'boolean',
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
      const { name, office, bustCache } = inputs;
      const slug = `${name}-${office}`;
      let candidate = await BallotCandidate.findOne({ slug });
      if (!candidate) {
        return exits.notFound();
      }
      if (candidate.presentationData && !bustCache) {
        // console.log('Returning cached candidate', candidate.presentationData);
        return exits.success({
          candidate: candidate.presentationData,
        });
      }
      const presentationData =
        await sails.helpers.candidate.generatePresentation(candidate.id);

      await BallotCandidate.updateOne({ slug }).set({
        presentationData,
      });

      return exits.success({
        candidate: presentationData,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.forbidden();
    }
  },
};
