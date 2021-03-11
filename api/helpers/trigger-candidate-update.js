const axios = require('axios');

module.exports = {
  friendlyName: 'Trigger Candidate Update',

  inputs: {
    candidateId: {
      type: 'number',
    },
  },

  async fn(inputs, exits) {
    const { candidateId } = inputs;
    const appBase = sails.config.custom.appBase || sails.config.appBase;
    try {
      await axios.get(`${appBase}/share-image/${candidateId}`);
    } catch (e) {
      console.log('error triggering candidate update');
    }
    return exits.success(`success`);
  },
};
