/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const slugify = require('slugify');

module.exports = {
  friendlyName: 'Create Campaign',

  inputs: {
    data: {
      type: 'json',
      required: true,
    },
  },

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
      const { data } = inputs;
      const { user } = this.req;
      // const exists = await Campaign.findOne({ user: user.id });
      // if (exists) {
      //   return inputs.badRequest({
      //     message: 'campaign already exists for this user',
      //   });
      // }

      const slug = await findSlug(data);
      data.slug = slug;
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

async function findSlug(campaign) {
  const { firstName, lastName } = campaign;
  const slug = slugify(`${firstName}-${lastName}`, { lower: true });
  const exists = await Campaign.findOne({ slug });
  if (!exists) {
    return slug;
  }
  for (let i = 1; i < 100; i++) {
    let slug = slugify(`${firstName}-${lastName}${i}`, { lower: true });
    let exists = await Campaign.findOne({ slug });
    if (!exists) {
      return slug;
    }
  }
  return slug; // should not happen
}
