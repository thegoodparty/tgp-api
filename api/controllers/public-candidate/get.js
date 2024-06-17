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
      const { name, office } = inputs;
      const slug = `${name}-${office}`;
      const candidate = await PublicCandidate.findOne({ slug });
      if (!candidate) {
        return exits.notFound();
      }

      // future - queue here an update from ballotCandidate. Maybe check last updated time first.

      return exits.success({
        candidate,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.forbidden();
    }
  },
};
