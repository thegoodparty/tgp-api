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
    source: {
      type: 'string',
    },
    uri: {
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

    password: {
      description: 'The new, unencrypted password.',
      example: 'abc123v2',
      type: 'string',
      minLength: 8,
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
  fn: async function (inputs, exits) {
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
        source,
        uri,
        password,
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
      if (!socialPic && !socialProvider && !socialId && !password) {
        return exits.badRequest({
          message: 'Password is required.',
        });
      }
      if (email) {
        const exists = await User.findOne({
          email: lowerCaseEmail,
        });
        try {
          await submitCrmForm(name, email, phone, source, uri);
        } catch (e) {
          //do nothing
        }

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

      if (password) {
        userAttr.password = password;
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

      const user = await User.create({
        ...userAttr,
      }).fetch();

      const token = await sails.helpers.jwtSign({
        id: user.id,
        email: lowerCaseEmail,
        phone,
      });

      // // check if the user has a pending invitation for a candidate campaign staff
      // const invitations = await StaffInvitation.find({ email: lowerCaseEmail });
      // if (invitations.length > 0) {
      //   for (let i = 0; i < invitations.length; i++) {
      //     const invitation = invitations[i];
      //     await Staff.create({
      //       role: invitation.role,
      //       user: user.id,
      //       candidate: invitation.candidate,
      //       createdBy: invitation.createdBy,
      //     });
      //     await StaffInvitation.destroyOne({ id: invitation.id });
      //   }
      // }

      //  add user to our CRM.
      await sails.helpers.crm.updateUser(user);

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

async function submitCrmForm(name, email, phone, source, uri) {
  if (!email) {
    // candidate page doesn't require email
    return;
  }
  const firstName = name.split(' ')[0];
  const lastName = name.split(' ').length > 0 && name.split(' ')[1];
  const crmFields = [
    { name: 'firstName', value: firstName, objectTypeId: '0-1' },
    { name: 'lastName', value: lastName, objectTypeId: '0-1' },
    { name: 'email', value: email, objectTypeId: '0-1' },
  ];
  if (phone) {
    crmFields.push({ name: 'phone', value: phone, objectTypeId: '0-1' });
  }

  const formId = '37d98f01-7062-405f-b0d1-c95179057db1';

  let resolvedSource = source || 'registerPage';

  await sails.helpers.crm.submitForm(formId, crmFields, resolvedSource, uri);
}
