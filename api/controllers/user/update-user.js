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

  fn: async function(inputs, exits) {
    try {
      const reqUser = this.req.user;
      const {
        name,
        email,
        feedback,
        phone,
        zip,
        displayName,
        pronouns,
      } = inputs;

      const updateFields = {};
      if (name) {
        updateFields.name = name;
      }
      if (feedback) {
        updateFields.feedback = feedback;
      }
      if (email && reqUser.email !== email) {
        updateFields.email = email;
        await sendEmail(reqUser.email, email);
        try {
          await sails.helpers.subscribeUser(email);
        } catch (e) {}
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

      const user = await User.updateOne({ id: reqUser.id }).set(updateFields);
      await sails.helpers.crm.updateUser(user);

      return exits.success({
        user,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error updating user', e);
      return exits.badRequest({
        message: 'Error updating user',
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
  const subject = `${user.firstName ||
    user.name}, please verify your email address`;
  const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
    <tbody>
      <tr>
        <td>
          <p
            style="
              font-size: 16px;
              font-family: Arial, sans-serif;
              margin-top: 0;
              margin-bottom: 5px;
            "
          >
            Hi ${user.firstName || user.name}!<br /><br />
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p
            style="
              font-size: 16px;
              font-family: Arial, sans-serif;
              margin-top: 0;
              margin-bottom: 5px;
            "
          >
            We need to know you’re not a bot and to be able to reach you with
            important campaign updates.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p
            style="
              font-size: 16px;
              font-family: Arial, sans-serif;
              margin-top: 0;
              margin-bottom: 5px;
            "
          >
          <br />
            Please click below to verify your email address.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <br /><br /><a
            href="${appBase}/email-confirmation?email=${email}&token=${
    user.emailConfToken
  }"
            style="
              padding: 16px 32px;
              background: linear-gradient(
                  103.63deg,
                  rgba(255, 15, 19, 0.15) -3.51%,
                  rgba(191, 0, 32, 0) 94.72%
                ),
                linear-gradient(
                  257.82deg,
                  rgba(67, 0, 211, 0.25) -11.17%,
                  rgba(67, 0, 211, 0) 96.34%
                ),
                #5c00c7;
              color: #fff;
              font-size: 16px;
              border-radius: 8px;
              text-decoration: none;
            "
          >
            CLICK TO VERIFY
          </a>
        </td>
      </tr>
    </tbody>
  </table>
  `;

  const messageHeader = '';
  await sails.helpers.mailgun.mailgunSender(
    email,
    user.name,
    subject,
    messageHeader,
    message,
  );
};
