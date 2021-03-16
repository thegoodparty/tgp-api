module.exports = {
  friendlyName: 'Remove user supports a candidate',

  inputs: {
    supportId: {
      example: 1,
      required: true,
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Support removed',
    },

    badRequest: {
      description: 'Error creating support',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { supportId } = inputs;
      const support = await Support.find({
        id: supportId,
      });
      await Support.destroyOne({
        id: supportId,
      });

      const user = await User.findOne({
        id: support.user,
      });

      await sails.helpers.updateTag(
        user.email,
        'The Good Party',
        support.candidate,
        'inactive',
      );
      return exits.success({
        message: 'support deleted',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error removing support',
      });
    }
  },
};
