/**
 * notifications/email-ama.js
 *
 * @description :: Sends and email to stakeholders when user submits a form.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Email Ask Me Anything',

  description: 'Send email when a user submits a form. Using Mailgun api',

  inputs: {
    message: {
      friendlyName: 'Error Message',
      type: 'string',
      required: true,
    },
    error: {
      friendlyName: 'Error Details',
      type: 'string',
      required: true,
    },
    uuid: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Error logged successfully',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error logging error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { message, error, uuid } = inputs;
      const user = await User.findOne({ uuid });
      await sails.helpers.errorLoggerHelper(
        `FRONT END ERROR: ${message}. USER UUID: ${uuid}. ${
          user ? `User: ${user.name}, email: ${user.email}` : ''
        }`,
        error,
      );

      return exits.success({
        message: 'Email Sent Successfully',
      });
    } catch (err) {
      console.log('error logging error');
      console.log(err);
      await sails.helpers.errorLoggerHelper(
        'Error at notifications/log-error',
        e,
      );
      return exits.badRequest({
        message: 'Error logging error',
      });
    }
  },
};
