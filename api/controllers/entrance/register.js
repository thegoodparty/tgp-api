/**
 * entrance/register.js
 *
 * @description :: Stand Alone action2 for signing up a user
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'register user',

  description: 'register a user with email and name',

  inputs: {
    firstName: {
      type: 'string',
      required: true,
    },
    lastName: {
      type: 'string',
      required: true,
    },
    email: {
      type: 'string',
      isEmail: true,
      required: true,
    },
    phone: {
      type: 'string',
      required: true,
    },
    zip: {
      type: 'string',
      required: true,
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
    conflict: {
      description: 'conflict',
      responseType: 'conflict',
      responseCode: 409,
    },
  },
  fn: async function (inputs, exits) {
    // Look up the user whose ID was specified in the request.
    // Note that we don't have to validate that `userId` is a number;
    // the machine runner does this for us and returns `badRequest`
    // if validation fails.
    try {
      let { firstName, lastName, email, phone, zip, password } = inputs;
      email = email.toLowerCase().trim();
      firstName = firstName.trim();
      lastName = lastName.trim();
      phone = phone.trim();
      zip = zip.trim();
      password = password.trim();

      const exists = await User.findOne({
        email,
      });
      if (exists) {
        return exits.conflict({
          message: `An account for ${email} already exists. Try logging instead.`,
          exists: true,
        });
      }

      const user = await User.create({
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        zip,
        phone,
        password,
        hasPassword: true,
      }).fetch();

      const token = await sails.helpers.jwtSign({
        id: user.id,
        email,
        phone,
      });

      //  add user to our CRM.
      await submitCrmForm(firstName, lastName, email, phone);
      await sails.helpers.crm.updateUser(user);

      return exits.success({
        user,
        token,
      });
    } catch (e) {
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

async function submitCrmForm(
  firstName,
  lastName,
  email,
  phone,
  uri = 'https://goodparty.org/sign-up',
) {
  const crmFields = [
    { name: 'firstName', value: firstName, objectTypeId: '0-1' },
    { name: 'lastName', value: lastName, objectTypeId: '0-1' },
    { name: 'email', value: email, objectTypeId: '0-1' },
    { name: 'phone', value: phone, objectTypeId: '0-1' },
  ];
  const formId = '37d98f01-7062-405f-b0d1-c95179057db1';

  let resolvedSource = 'registerPage';

  await sails.helpers.crm.submitForm(formId, crmFields, resolvedSource, uri);
}
