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

  fn: async function (inputs, exits) {
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
        try {
          await sails.helpers.addEmail(email, 'The Good Party');
        } catch (e) { }
      }
      if (phone) {
        updateFields.phone = phone;
      }

      if (zip) {
        let zipCode = await ZipCode.findOne({ zip });
        if (zipCode) {
          const { stateShort } = zipCode;
          updateFields.zipCode = zipCode.id;
          updateFields.shortState = stateShort;
          updateFields.districtNumber = null;

          let { approxPctArr } = zipCode;
          if (approxPctArr) {
            approxPctArr = JSON.parse(approxPctArr);
            if (approxPctArr.length > 0) {
              const congDistrict = await CongDistrict.findOne({
                id: approxPctArr[0].districtId,
              }).populate('state');
              updateFields.congDistrict = congDistrict.id;
              updateFields.districtNumber = congDistrict.code;
              updateFields.shortState = congDistrict.state
                ? congDistrict.state.shortName
                : '';
            }
          }
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
  const subject = `${user.firstName || user.name}, please verify your email address`;
  const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
    <tbody>
      <tr>
        <td>
          <p
            style="
              font-family: Arial, sans-serif;
              font-size: 18px;
              line-height: 26px;
              color: ##555555;
              margin: 0;
              text-align: left;
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
              font-family: Arial, sans-serif;
              font-size: 18px;
              line-height: 26px;
              color: ##555555;
              margin: 0;
              text-align: left;
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
              font-family: Arial, sans-serif;
              font-size: 18px;
              line-height: 26px;
              color: ##555555;
              margin: 0;
              text-align: left;
            "
          >
            Please click below to verify your email address.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <br /><br /><br /><a
            href="${appBase}/email-confirmation?email=${email}&token=${user.emailConfToken}"
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
      <tr>
        <td style="text-align: center">
          <br /><br /><br /><br />
          <p
            style="
              font-style: italic;
              font-weight: normal;
              font-size: 16px;
              line-height: 22px;
              text-align: center;
              color: #555555;
            "
          >
            Free software for free elections by
          </p>
        </td>
      </tr>
      <tr>
        <td style="text-align: center">
          <img
            style="margin: 0 auto"
            src="https://s3-us-west-2.amazonaws.com/assets.thegoodparty.org/new-heart.png"
          />
        </td>
      </tr>
      <tr>
        <td style="text-align: center">
          <br /><br />
          <p
            style="
              font-weight: normal;
              font-size: 11px;
              line-height: 15px;
              /* identical to box height, or 136% */

              text-align: center;
              letter-spacing: 0.5px;

              /* Neutral/N40 - Faded Ink */

              color: #666666;
            "
          >
            To stop receiving updates, you can remove this campaign from your
            endorsements
          </p>
        </td>
      </tr>
      <tr>
        <td style="text-align: center">
          <img
            style="margin: 0 auto"
            src="https://s3-us-west-2.amazonaws.com/assets.thegoodparty.org/compliance.png"
          />
        </td>
      </tr>
    </tbody>
  </table>
  `;

  const messageHeader = '';
  await sails.helpers.mailgunSender(
    email,
    user.name,
    subject,
    messageHeader,
    message,
  );
};
