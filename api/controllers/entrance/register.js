/**
 * entrance/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'register user',

  description: 'register a user with email and name',

  inputs: {
    email: {
      type: 'string',
      isEmail: true,
    },
    phone: {
      type: 'string',
    },

    name: {
      description: 'User Name',
      type: 'string',
      required: true,
    },
    zip: {
      type: 'string',
    },

    socialId: {
      type: 'string',
      required: false,
      description: 'Social Channel Id',
    },

    socialProvider: {
      type: 'string',
      required: false,
      description: 'Social Channel',
    },
    socialPic: {
      type: 'string',
      required: false,
      description: 'Social Channel profile image url',
    },
    socialToken: {
      description: 'Social Token that needs to be verified',
      type: 'string',
      required: false,
    },
    guestUuid: {
      description: 'uuid that was generated on the front end',
      type: 'string',
      required: false,
    },
  },

  exits: {
    success: {
      description: 'User Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'register Failed',
      responseType: 'badRequest',
    },
  },
  fn: async function(inputs, exits) {
    // Look up the user whose ID was specified in the request.
    // Note that we don't have to validate that `userId` is a number;
    // the machine runner does this for us and returns `badRequest`
    // if validation fails.
    try {
      const {
        email,
        zip,
        phone,
        socialId,
        socialProvider,
        socialPic,
        socialToken,
        guestUuid,
      } = inputs;

      if (!phone && !email) {
        return exits.badRequest({
          message: 'Phone or Email are required.',
        });
      }
      const lowerCaseEmail = email ? email.toLowerCase() : email;
      const name = inputs.name.trim();

      if (!socialPic && !socialProvider && !socialId && !zip) {
        return exits.badRequest({
          message: 'Zip code is required.',
        });
      }
      if (email) {
        const exists = await User.findOne({
          email: lowerCaseEmail,
        });
        if (exists) {
          return exits.badRequest({
            message: `An account for ${lowerCaseEmail} already exists. Try logging instead.`,
            exists: true,
          });
        }
      } else if (phone) {
        const exists = await User.findOne({
          phone,
        });
        if (exists) {
          const formatPhone = await sails.helpers.formatPhone(phone);
          return exits.badRequest({
            message: `An account for ${formatPhone} already exists. Try logging instead.`,
            exists: true,
          });
        }
      }

      // const phoneExists = await User.findOne({
      //   phone,
      // });
      // if (phoneExists) {
      //   return exits.badRequest({
      //     message: `${phone} already exists in our system. Try login instead`,
      //     exists: true,
      //   });
      // }

      const userAttr = {
        name,
      };
      if (zip) {
        userAttr.zip = zip;
      }
      if (lowerCaseEmail) {
        userAttr.email = lowerCaseEmail;
      }
      if (phone) {
        userAttr.phone = phone;
      }

      if (socialId) {
        userAttr.socialId = socialId;
      }
      if (socialProvider) {
        userAttr.socialProvider = socialProvider;
      }
      if (socialPic) {
        userAttr.avatar = socialPic;
      }

      if (socialPic || socialProvider || socialId) {
        try {
          await sails.helpers.verifySocialToken(
            lowerCaseEmail,
            socialToken,
            socialProvider,
          );
          userAttr.isEmailVerified = true;
        } catch (e) {
          return exits.badRequest({
            message: 'Invalid Token',
          });
        }
      }

      const uuid =
        guestUuid ||
        Math.random()
          .toString(36)
          .substring(2, 12);

      const user = await User.create({
        uuid,
        ...userAttr,
      }).fetch();

      if (!socialPic && !socialProvider && !socialId) {
        // send sms to the newly created user.
        if (phone) {
          await sails.helpers.sms.smsVerify(phone);
        } else {
          await sendWVerifyEmail(user);
        }
      }
      try {
        if (lowerCaseEmail) {
          await sails.helpers.subscribeUser(lowerCaseEmail);
        }
      } catch (e) {}

      //  add user to our CRM.
      try {
        await sails.helpers.crm.create(user);
      } catch (e) {}

      const token = await sails.helpers.jwtSign({
        id: user.id,
        email: lowerCaseEmail,
        phone,
      });

      // check if the user has a pending invitation for a candidate campaign staff
      const invitations = await StaffInvitation.find({ email: lowerCaseEmail });
      if (invitations.length > 0) {
        for (let i = 0; i < invitations.length; i++) {
          const invitation = invitations[i];
          await Staff.create({
            role: invitation.role,
            user: user.id,
            candidate: invitation.candidate,
            createdBy: invitation.createdBy,
          });
          await StaffInvitation.destroyOne({ id: invitation.id });
        }
      }

      return exits.success({
        user,
        token,
      });
    } catch (e) {
      // await sails.helpers.errorLoggerHelper('Error at entrance/register', e);
      console.log('register error', e);
      try {
        if (e.cause.details.includes('`name`')) {
          return exits.badRequest({
            message: 'Exceeded max characters for name',
          });
        } else {
          return exits.badRequest({ message: 'Error registering account.' });
        }
      } catch (error) {
        return exits.badRequest({ message: 'Error registering account.' });
      }
    }
  },
};

const sendWVerifyEmail = async user => {
  if (!user.email || user.email === '') {
    return;
  }
  const lowerCaseEmail = user.email.toLowerCase();
  const { name } = user;
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
                  <br/>
                  Please use this code to verify your email address.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <br /><br />
                <p style="
                    font-size: 30px;
                    font-family: Arial, sans-serif;
                    background: #cccccc;
                    padding: 20px;
                    border-radius: 6px;
                    text-align: center;
                    "
                    >${user.emailConfToken}</p>
              </td>
            </tr>
          </tbody>
        </table>
        `;
  const messageHeader = '';
  await sails.helpers.mailgun.mailgunSender(
    lowerCaseEmail,
    name,
    subject,
    messageHeader,
    message,
  );
};
