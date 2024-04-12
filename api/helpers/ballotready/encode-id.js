module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
    model: {
      type: 'string',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { id, model } = inputs;

      console.log(`encoding model:${model}. id:${id}.`);
      // PositionElection is a BallotRace.
      // Candidate is a BallotCandidate.
      if (
        model === 'PositionElection' ||
        model === 'Position' ||
        model === 'Candidate' ||
        model === 'Candidacy' ||
        model === 'Election'
      ) {
        const str = `gid://ballot-factory/${model}/${id}`;
        const encoded = Buffer.from(str).toString('base64');
        return exits.success(encoded);
      } else {
        return exits.badRequest('Invalid model');
      }
    } catch (e) {
      console.log('error at encrypt-id', e);
      return exits.success(false);
    }
  },
};
