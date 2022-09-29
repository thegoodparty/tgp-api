module.exports = {
  friendlyName: 'User supports',

  inputs: {
    withCandidates: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Supports found',
    },

    badRequest: {
      description: 'Error finding support',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { withCandidates } = inputs;
      let reqUser = this.req.user;
      const supports = await Support.find({
        user: reqUser.id,
      });
      if (!withCandidates) {
        const hash = {};
        supports.forEach(support => {
          hash[support.candidate] = true;
        });

        return exits.success({
          supports: hash,
        });
      }
      const candidates = [];
      if (withCandidates) {
        for (let i = 0; i < supports.length; i++) {
          const id = supports[i].candidate;
          const candidate = await Candidate.findOne({
            id,
            isActive: true,
          });
          const data = JSON.parse(candidate.data);
          let followers = {};
          followers = await sails.helpers.socialListening.candidateFollowersHelper(
            candidate,
          );
          const support = await sails.helpers.support.supportByCandidate(id);

          followers.thisWeek += support.thisWeek;
          followers.lastWeek += support.lastWeek;
          data.followers = followers;

          const candPositions = await CandidatePosition.find({ candidate: id })
            .sort([{ order: 'ASC' }])
            .populate('position');
          let positions = [];
          candPositions.forEach(pos => {
            positions.push(pos.position);
          });
          data.positions = positions;
          if (candidate) {
            candidates.push(data);
          }
        }
      }

      return exits.success({
        candidates,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error finding supports',
      });
    }
  },
};
