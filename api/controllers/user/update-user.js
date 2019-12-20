module.exports = {
  friendlyName: 'Update User',

  description: 'update name and email for a logged in user.',

  inputs: {
    name: {
      description: 'First Name',
      example: 'John',
      required: false,
      type: 'string',
    },

    email: {
      description: 'Email',
      example: 'mary.sue@example.com',
      required: false,
      type: 'string',
      isEmail: true,
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
      const { name, email } = inputs;
      if (!name && !email) {
        return exits.badRequest({
          message: 'Name or Email are required',
        });
      }

      const updateFields = {};
      if (name) {
        updateFields.name = name;
      }
      if (email) {
        updateFields.email = email;
      }

      await User.updateOne({ id: reqUser.id }).set(updateFields);

      const user = await User.findOne({ id: reqUser.id })
        .populate('congressionalDistrict')
        .populate('houseDistrict')
        .populate('senateDistrict');

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
