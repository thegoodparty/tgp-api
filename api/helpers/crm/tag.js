// https://nationbuilder.com/api_documentation
const axios = require('axios');

const nationBuilderAccessToken =
  sails.config.custom.nationBuilderAccessToken ||
  sails.config.nationBuilderAccessToken;

module.exports = {
  inputs: {
    user: {
      type: 'json',
      required: true,
    },
    candidate: {
      type: 'json',
      required: true,
    },
    deleteTag: {
      type: 'boolean',
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
  fn: async function(inputs, exits) {
    const { user, candidate, deleteTag } = inputs;
    let metaData = user.metaData;
    if (!metaData || metaData === '') {
      return exits.success('no meta data');
    }
    metaData = JSON.parse(user.metaData);
    const nationBuilderId = metaData.nationBuilderId;
    if (!nationBuilderId) {
      return exits.success('no nation builder id');
    }
    const tag = `${candidate.firstName} ${candidate.lastName}`;

    if (!deleteTag) {
      const url = `https://goodparty.nationbuilder.com/api/v1/people/${nationBuilderId}/taggings?access_token=${nationBuilderAccessToken}`;
      const body = {
        tagging: {
          tag,
        },
      };

      await axios({
        url,
        method: 'PUT',
        data: body,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    } else {
      const url = `https://goodparty.nationbuilder.com/api/v1/people/${nationBuilderId}/taggings/${tag}?access_token=${nationBuilderAccessToken}`;

      await axios({
        url,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    }

    return exits.success('ok');
  },
};
