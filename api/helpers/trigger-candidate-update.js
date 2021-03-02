const axios = require('axios');

module.exports = {
  friendlyName: 'Trigger Candidate Update',

  inputs: {
    candidateId: {
      type: 'number',
    },
  },

  async fn(inputs, exits) {
    try {
      const { candidateId } = inputs;
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      await axios.get(`${appBase}/share-image/${candidateId}`);
      return exits.success(`success`);
    } catch (e) {
      return exits.badRequest({
        message: 'Error trigger',
      });
    }
  },
};

const candidateLastName = candidate => {
  if (!candidate) {
    return '';
  }
  const nameArr = candidate.name ? candidate.name.split(' ') : [];

  return candidate.name ? nameArr[nameArr.length - 1] : '';
};
