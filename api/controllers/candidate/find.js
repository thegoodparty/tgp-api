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
      let { name, office, bustCache } = inputs;
      const slug = `${name}-${office}`;
      let candidate = await BallotCandidate.findOne({
        where: {
          and: [
            { slug },
            { party: { '!=': 'Republican' } },
            { party: { '!=': 'Democratic' } },
            { party: { '!=': 'Democratic-Farmer-Labor' } },
            { positionId: { '!=': '' } },
            { positionId: { '!=': null } },
            { raceId: { '!=': '' } },
            { raceId: { '!=': null } },
          ],
        },
      });
      if (!candidate) {
        return exits.notFound();
      }

      // force update based on date (when fixing a bug).
      if (candidate.presentationData) {
        const now = new Date();
        if (!candidate.presentationData.updatedAt) {
          bustCache = true;
        } else {
          if (candidate.presentationData.updatedAt < now) {
            bustCache = true;
          }
        }
      }

      if (candidate.presentationData && !bustCache) {
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
