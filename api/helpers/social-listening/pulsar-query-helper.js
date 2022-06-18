const { GraphQLClient, gql } = require('graphql-request');

const pulsarApi = sails.config.custom.pulsarApi || sails.config.pulsarApi;

module.exports = {
  friendlyName: 'Pulsar GraphQl helper',

  description:
    'https://doc.pulsarplatform.com/pulsar-documentation/graphql/data-explorer',

  inputs: {
    query: {
      type: 'string',
      required: true,
    },
    variables: {
      type: 'ref',
    },
    api: {
      type: 'string',
      required: true,
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { query, api, variables } = inputs;

      const endpoint =
        api === 'core'
          ? 'https://data-explorer.pulsarplatform.com/graphql/core'
          : 'https://data-explorer.pulsarplatform.com/graphql/trac';

      const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
          authorization: `Bearer ${pulsarApi}`,
          'Content-Type': 'application/json',
        },
      });

      const gqlQuery = gql`
        ${query}
      `;

      const data = await graphQLClient.request(gqlQuery, variables || {});

      return exits.success(data);
    } catch (e) {
      console.log('error at helpers/socialListening/pulsar-query-helper', e);
      throw e;
    }
  },
};
