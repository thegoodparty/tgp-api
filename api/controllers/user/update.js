module.exports = {
  friendlyName: 'Update User',

  description: 'update name and email for a logged in user.',

  inputs: {
    firstName: {
      required: false,
      type: 'string',
      maxLength: 120,
    },
    lastName: {
      required: false,
      type: 'string',
      maxLength: 120,
    },

    email: {
      description: 'Email',
      example: 'mary.sue@example.com',
      required: false,
      type: 'string',
      isEmail: true,
    },

    phone: {
      description: 'Phone Number',
      example: '3101234567',
      required: false,
      type: 'string',
      maxLength: 11,
    },

    feedback: {
      description: 'User Feedback',
      required: false,
      type: 'string',
      maxLength: 140,
    },

    zip: {
      description: 'User ZipCode',
      required: false,
      type: 'string',
      maxLength: 5,
    },

    displayName: {
      required: false,
      type: 'string',
    },

    pronouns: {
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

  fn: async function (inputs, exits) {
    try {
      const reqUser = this.req.user;
      const {
        firstName,
        lastName,
        email,
        feedback,
        phone,
        zip,
        displayName,
        pronouns,
      } = inputs;

      const updateFields = {};
      if (firstName) {
        updateFields.firstName = firstName;
      }
      if (lastName) {
        updateFields.lastName = lastName;
      }
      if (feedback) {
        updateFields.feedback = feedback;
      }
      if (email && reqUser.email !== email) {
        updateFields.email = email;
      }
      if (phone) {
        updateFields.phone = phone;
      }

      if (zip) {
        updateFields.zip = zip;
      }

      if (displayName) {
        updateFields.displayName = displayName;
      }

      if (pronouns) {
        updateFields.pronouns = pronouns;
      }

      const user = await User.updateOne({ id: reqUser.id }).set(updateFields);
      await sails.helpers.crm.updateUser(user);

      return exits.success({
        user,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('Error updating user', e);
      return exits.badRequest({
        message: 'Error updating user',
      });
    }
  },
};
