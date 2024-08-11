module.exports = {
  inputs: {
    appId: {
      type: 'string',
      // required: true,
    },
    objectId: {
      type: 'string',
      // required: true,
    },
    subscriptionType: {
      type: 'string',
      // required: true,
    },
    propertyName: {
      type: 'string',
      // required: true,
    },
    propertyValue: {
      type: 'string',
      // required: true,
    },
  },

  exits: {
    success: {
      description: 'found',
    },

    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },

    notFound: {
      description: 'Not Found',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { objectId, appId, subscriptionType, propertyName, propertyValue } =
        inputs;

      const payload = req.body;

      await sails.helpers.slack.errorLoggerHelper('CRM hubspot webhook', {
        objectId,
        appId,
        subscriptionType,
        propertyName,
        propertyValue,
        allParams: this.req.allParams(),
        payload,
      });

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('error at jobs/get', e);
      return exits.notFound();
    }
  },
};
