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
      type: 'string',
    },

    uri: {
      required: true,
      type: 'string',
    },
    formId: {
      type: 'string',
    },
    pageName: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Email has been subscribed successfully',
    },

    badRequest: {
      description: 'Error subscribing email',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { email, uri, name, formId, pageName } = inputs;
      const id = formId || '5d84452a-01df-422b-9734-580148677d2c';

      const crmFields = [
        { name: 'email', value: email.toLowerCase(), objectTypeId: '0-1' },
      ];
      if (name) {
        crmFields.push({ name: 'full_name', value: name, objectTypeId: '0-1' });
      }

      const page = pageName || 'homePage';

      await sails.helpers.crm.submitForm(id, crmFields, page, uri);

      return exits.success({ message: 'success' });
    } catch (err) {
      return exits.badRequest({ message: 'Error subscribing email' });
    }
  },
};
