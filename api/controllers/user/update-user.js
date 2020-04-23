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
  const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
                     <tr>
                        <td>
                          <h2 style="color: #484848; text-align: left; font-size: 33px;  letter-spacing: 1px; margin-top: 24px; margin-bottom: 24px;">
                            Please confirm your email
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                            Hi ${user.name}!,<br/> <br>
                          </p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td>
                            <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                              Welcome to The Good Party!  Please tap to 
                              <a href="${appBase}/email-confirmation?email=${email}&token=${user.emailConfToken}">confirm your email</a>, 
                              so we can get you counted.
                            </p>
                         </td>
                      </tr>
                      <tr>
                        <td>
                          <br/><br/><br/>
                          <a href="${appBase}/email-confirmation?email=${email}&token=${user.emailConfToken}" style="padding: 16px 32px; background-color: #117CB6; color: #FFF; border-radius: 40px; text-decoration: none;">
                            Confirm Email                              
                          </a>
                        </td>
                      </tr>
                    </table>`;

  const messageHeader = '';
  await sails.helpers.mailgunSender(
    email,
    user.name,
    subject,
    messageHeader,
    message,
  );
};
