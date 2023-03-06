/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const slugify = require('slugify');

module.exports = {
  friendlyName: 'Create Campaign',

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

      const slug = await findSlug(user.name);
      const data = { slug };
      await Campaign.create({
        slug,
        data,
        isActive: false,
        user: user.id,
      });

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
