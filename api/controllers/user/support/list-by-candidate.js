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
      for (let i = 0; i < candidateSupports.length; i++) {
        const support = candidateSupports[i];
        support.timeAgo = timeago.ago(new Date(support.updatedAt));
        if (support.user && support.user.name) {
          support.user = await sails.helpers.fullFirstLastInitials(
            support.user.name,
          );
        } else {
          support.user = '';
        }
      }

      return exits.success({
        candidateSupports,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error finding supports',
      });
    }
  },
};
