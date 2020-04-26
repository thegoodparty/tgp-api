module.exports = {
  friendlyName: 'Update User Ranking',

  description: 'update chamber ranking for a logged in user.',

  inputs: {
    presidentialRank: {
      description: 'stringified array of presidential candidates ids',
      example: '[1,3,2]',
      required: false,
      type: 'string',
    },

    senateRank: {
      description: 'stringified array of senate candidates ids',
      example: '[1,3,2]',
      required: false,
      type: 'string',
    },

    houseRank: {
      description: 'stringified array of house candidates ids',
      example: '[1,3,2]',
      required: false,
      type: 'string',
    },
  },

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
      const { presidentialRank, senateRank, houseRank } = inputs;

      const updateFields = {};
      if (presidentialRank || presidentialRank === '') {
        updateFields.presidentialRank = presidentialRank;
      }
      if (senateRank || senateRank === '') {
        updateFields.senateRank = senateRank;
      }
      if (houseRank || houseRank === '') {
        updateFields.houseRank = houseRank;
      }
      await User.updateOne({ id: reqUser.id }).set(updateFields);

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
