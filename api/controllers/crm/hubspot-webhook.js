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
      const payload = this.req.body;
      if (payload && payload.length > 0) {
        for (let i = 0; i < payload.length; i++) {
          const {
            objectId,
            appId,
            subscriptionType,
            propertyName,
            propertyValue,
          } = payload[i];

          await sails.helpers.slack.errorLoggerHelper('CRM hubspot webhook', {
            objectId,
            appId,
            subscriptionType,
            propertyName,
            propertyValue,
          });
        }
      }

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('error at jobs/get', e);
      return exits.badRequest();
    }
  },
};
