module.exports = {
  friendlyName: 'Update User',

  description: 'update name and email for a logged in user.',

  inputs: {
    name: {
      description: 'Full Name',
      example: 'John Smith',
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
      const { name, email, feedback, phone, zip, displayName, pronouns } =
        inputs;

      const updateFields = {};
      if (name) {
        updateFields.name = name;
      }
      if (feedback) {
        updateFields.feedback = feedback;
      }
      if (email && reqUser.email !== email) {
        updateFields.email = email;
      }
      if (phone && reqUser.phone !== phone) {
        updateFields.phone = phone;
        updateFields.isPhoneVerified = false;
        await sails.helpers.sms.smsVerify(phone);
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

      // this one is for profile settings where they can remove email/phone/display name
      // name and zip are the required fields
      if (name && zip) {
        if (!displayName) {
          updateFields.displayName = '';
        }
        // only one is required.
        if (email && !phone) {
          updateFields.phone = '';
        }
        if (phone && !email) {
          updateFields.email = '';
        }
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
