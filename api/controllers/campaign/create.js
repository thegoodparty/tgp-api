/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const slugify = require('slugify');

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Campaign Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'creation failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;
      const userName = await sails.helpers.user.name(user);
      if (userName === '') {
        return exits.badRequest('No user name');
      }

      const slug = await findSlug(userName);
      const data = {
        slug,
        currentStep: 'registration',
      };

      // see if the user already have campaign
      const existing = await Campaign.findOne({ user: user.id });
      if (existing) {
        return exits.success({
          slug: existing.slug,
        });
      }

      await Campaign.create({
        slug,
        data,
        isActive: false,
        user: user.id,
      });
      await submitCrmForm(user.firstName, user.lastName, user.email);

      return exits.success({
        slug,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};

async function findSlug(name) {
  const slug = slugify(`${name}`, { lower: true });
  const exists = await Campaign.findOne({ slug });
  if (!exists) {
    return slug;
  }
  for (let i = 1; i < 100; i++) {
    let slug = slugify(`${name}${i}`, { lower: true });
    let exists = await Campaign.findOne({ slug });
    if (!exists) {
      return slug;
    }
  }
  return slug; // should not happen
}

async function submitCrmForm(firstName, lastName, email) {
  if (!email || !firstName) {
    // candidate page doesn't require email
    return;
  }

  const crmFields = [
    { name: 'firstName', value: firstName, objectTypeId: '0-1' },
    { name: 'lastName', value: lastName, objectTypeId: '0-1' },
    { name: 'email', value: email, objectTypeId: '0-1' },
  ];
  const formId = '37d98f01-7062-405f-b0d1-c95179057db1';

  let resolvedSource = 'loginPage';

  await sails.helpers.crm.submitForm(
    formId,
    crmFields,
    resolvedSource,
    'https://goodparty.org/login',
  );
}
