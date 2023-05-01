// https://legacydocs.hubspot.com/docs/methods/forms/submit_form
const axios = require('axios');

module.exports = {
  inputs: {
    formId: {
      type: 'string',
      required: true,
    },
    fields: {
      type: 'json',
      required: true,
    },
    pageName: {
      type: 'string',
      required: true,
    },
    uri: {
      type: 'string',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    const { formId, fields, pageName, uri } = inputs;
    let formResp;
    try {
      const url = `https://api.hsforms.com/submissions/v3/integration/submit/21589597/${formId}`;
      formResp = await axios({
        url,
        method: 'POST',
        data: {
          fields,
          context: {
            pageName,
            pageUri: uri,
          },
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      // console.log('formResp', formResp);

      return exits.success('ok');
    } catch (e) {
      console.log('hubspot error', e);
      console.log('hubspot error', e.response.data.errors);
      await sails.helpers.errorLoggerHelper('Error submitting form', e);
      // todo: change this to exirs.badRequest ?
      // frontend would need to be updated ?
      return exits.success('not ok');
    }
  },
};
