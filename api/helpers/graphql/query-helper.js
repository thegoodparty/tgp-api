const { GraphQLClient, gql } = require('graphql-request');

const ballotReadyKey =
  sails.config.custom.ballotReady || sails.config.ballotReady;

module.exports = {
  friendlyName: 'Pulsar GraphQl helper',

  description: 'https://developers.civicengine.com/docs/api/graphql',

  inputs: {
    query: {
      type: 'string',
      required: true,
    },
    variables: {
      type: 'ref',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { query, variables } = inputs;
      let endpoint = 'https://bpi.civicengine.com/graphql';

      const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
          authorization: `Bearer ${ballotReadyKey}`,
          'Content-Type': 'application/json',
        },
      });

      const gqlQuery = gql`
        ${query}
      `;

      const data = await graphQLClient.request(gqlQuery, variables || {});

      return exits.success(data);
    } catch (e) {
      console.log('error at helpers/graphql/query-helper', e);
      throw e;
    }
  },
};
