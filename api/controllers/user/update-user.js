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
      const { name, email, feedback, phone, zip } = inputs;
      if (!name && !email && !feedback && !zip && !phone) {
        return exits.badRequest({
          message: 'Name, Feedback, Zip or Email are required',
        });
      }

      const updateFields = {};
      if (name) {
        updateFields.name = name;
      }
      if (feedback) {
        updateFields.feedback = feedback;
      }
      if (email) {
        updateFields.email = email;
        await sendEmail(reqUser.email, email);
      }
      if (phone) {
        updateFields.phone = phone;
      }
      if (zip) {
        let zipCode = await ZipCode.findOne({ zip });
        if (zipCode) {
          updateFields.zipCode = zipCode.id;
        }
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

const sendEmail = async (reqEmail, email) => {
  const token = await sails.helpers.strings.random('url-friendly');
  const user = await User.updateOne({ email: reqEmail }).set({
    emailConfToken: token,
    emailConfTokenDateCreated: Date.now(),
    isEmailVerified: false,
  });

  const appBase = sails.config.custom.appBase || sails.config.appBase;
  const subject = `Please Confirm your email address - The Good Party`;
  const message = `Hi ${user.name},<br/> <br/>
                         Welcome to The Good Party! In order to get counted, you need to confirm your email address. <br/> <br/>
                         <a href="${appBase}/email-confirmation?email=${email}&token=${user.emailConfToken}">Confirm Email</a>`;
  const messageHeader = 'Please confirm your email';
  await sails.helpers.mailgunSender(
    email,
    user.name,
    subject,
    messageHeader,
    message,
  );
};
