/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Track Visit',

  inputs: {
    url: {
      type: 'string',
      required: true,
    },
    data: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
  },
  async fn(inputs, exits) {
    try {
      const { url, data } = inputs;
      await Visit.create({ url, data });
      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('Error creating campaign updates', e);
      return exits.badRequest({ message: 'Error registering visit' });
    }
  },
};
