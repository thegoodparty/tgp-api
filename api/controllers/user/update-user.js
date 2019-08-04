module.exports = {
  friendlyName: 'Update User',

  description: 'update name and email for a logged in user.',

  inputs: {
    firstName: {
      description: 'First Name',
      example: 'John',
      required: false,
      type: 'string',
    },
    lastName: {
      description: 'Last Name',
      example: 'Smith',
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
      const { firstName, lastName, email } = inputs;
      if (!firstName && !lastName && !email) {
        return exits.badRequest({
          message: 'First Name, Last Name or Email are required',
        });
      }

      const updateFields = {};
      if (firstName) {
        updateFields.firstName = firstName;
      }
      if (lastName) {
        updateFields.lastName = lastName;
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
