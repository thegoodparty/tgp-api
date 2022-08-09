/**
 * subscribe/subscribe-email.js
 *
 * @description :: Users can subscribe their email on the homepage
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Subscribe email',

  description: 'Subscribe email hubspot.',

  inputs: {
    email: {
      required: true,
      type: 'string',
      isEmail: true,
    },
    name: {
      required: true,
      type: 'string',
    },
    phone: {
      type: 'string',
    },

    uri: {
      required: true,
      type: 'string',
    },
    candidateId: {
      required: true,
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Claimed',
    },

    badRequest: {
      description: 'Error claiming campaign',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { email, uri, name, phone, candidateId } = inputs;
      const formId = '20b20268-b3c2-41fd-957a-15cfac20c475';
      const lowerEmail = email.toLowerCase();

      const crmFields = [
        { name: 'email', value: lowerEmail, objectTypeId: '0-1' },
        { name: 'full_name', value: name, objectTypeId: '0-1' },
        { name: 'phone', value: phone, objectTypeId: '0-1' },
      ];

      await sails.helpers.crm.submitForm(
        formId,
        crmFields,
        'Candidate Page',
        uri,
      );

      const existingUser = await User.findOne({ email: lowerEmail });

      if (!existingUser) {
        const uuid = Math.random()
          .toString(36)
          .substring(2, 12);
        await User.create({
          uuid,
          name,
          email: lowerEmail,
        });
      }

      return exits.success({ message: 'success' });
    } catch (err) {
      return exits.badRequest({ message: 'Error claiming campaign' });
    }
  },
};
