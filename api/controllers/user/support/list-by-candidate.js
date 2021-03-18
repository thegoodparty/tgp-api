const timeago = require('time-ago');
module.exports = {
  friendlyName: 'User supports',

  inputs: {
    candidateId: {
      description: 'candidate id',
      example: 1,
      required: true,
      type: 'number',
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
      const { candidateId } = inputs;
      const candidateSupports = await Support.find({
        candidate: candidateId,
      })
        .sort([{ updatedAt: 'DESC' }])
        .populate('user');

      const MAX = 20;
      const supportLength = Math.min(MAX, candidateSupports.length);
      for (let i = 0; i < supportLength; i++) {
        const support = candidateSupports[i];
        support.timeAgo = timeago.ago(new Date(support.updatedAt));
        support.message = null;
        support.type = 'endorse';
        if (support.user && support.user.name) {
          support.user = await sails.helpers.fullFirstLastInitials(
            support.user.name,
          );
        } else {
          support.user = '';
        }
      }

      const candidateShares = await ShareCandidate.find({
        candidate: candidateId,
      })
        .sort([{ updatedAt: 'DESC' }])
        .populate('user');

      const shareLength = Math.min(MAX, candidateShares.length);
      for (let i = 0; i < shareLength; i++) {
        const share = candidateShares[i];
        share.timeAgo = timeago.ago(new Date(share.updatedAt));
        share.type = 'share';
        if (share.user && share.user.name) {
          share.user = await sails.helpers.fullFirstLastInitials(
            share.user.name,
          );
        } else {
          share.user = '';
        }
      }
      const combined = candidateSupports.concat(candidateShares);
      combined.sort((a, b) => b.updatedAt - a.updatedAt);

      return exits.success({
        candidateSupports: combined,
        total: candidateSupports.length + candidateShares.length,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error finding supports',
      });
    }
  },
};
