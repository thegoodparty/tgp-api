/* eslint-disable object-shorthand */

const ballotReady = sails.config.custom.ballotReady || sails.config.ballotReady;
const axios = require('axios');

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;

      // const campaign = await sails.helpers.campaign.byUser(user);
      // const { details } = campaign;
      // const { zip } = details;

      const endpoint = 'https://api.civicengine.com';

      const url = `${endpoint}/elections?latitude=40.81308&longitude=-73.04639`;
      console.log('api', ballotReady);
      res = await axios({
        url,
        method: 'GET',
        headers: {
          // 'Content-Type': 'application/json',
          'x-api-key': ballotReady,
        },
      });

      return exits.success({ res });
    } catch (e) {
      console.log('error at ballotData/create', e);
      return exits.badRequest();
    }
  },
};
