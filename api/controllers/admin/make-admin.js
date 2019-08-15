module.exports = {
  friendlyName: 'Update User',

  description: 'update name and email for a logged in user.',

  inputs: {
    phone: {
      description: 'User Phone',
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'User is now an admin.',
    },

    badRequest: {
      description: 'Error updating user',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const user = await User.updateOne({ phone: inputs.phone }).set({
        role: sails.config.custom.rolesEnums.ADMIN,
      });

      return exits.success({
        user,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error updating user',
      });
    }
  },
};
