module.exports = {
  friendlyName: 'Delete User Ranking',

  description: 'delete house and senate ranking for a logged in user.',

  inputs: {},

  exits: {
    success: {
      description: 'User successfully updated.',
    },

    badRequest: {
      description: 'Error updating user',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const reqUser = this.req.user;

      await User.updateOne({ id: reqUser.id }).set({
        houseRank: '',
        senateRank: '',
      });

      const user = await User.findOne({ id: reqUser.id });
      const zipCode = await ZipCode.findOne({
        id: user.zipCode,
      }).populate('cds');
      user.zipCode = zipCode;

      return exits.success({
        user,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error saving address',
      });
    }
  },
};
