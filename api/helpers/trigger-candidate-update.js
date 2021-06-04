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
    console.log('candidateId:', candidateId, `${appBase}/share-image/${candidateId}`)
    try {
      await axios.get(`http://localhost:4000/share-image/${candidateId}`);
    } catch (e) {
      console.log('error triggering candidate update');
    }
    return exits.success(`success`);
  },
};
