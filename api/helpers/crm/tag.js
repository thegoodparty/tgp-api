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
    const { user, candidate } = inputs;
    let metaData = user.metaData;
    if (!metaData || metaData === '') {
      return exits.success('no meta data');
    }
    metaData = JSON.parse(user.metaData);
    const nationBuilderId = metaData.nationBuilderId;
    if (!nationBuilderId) {
      return exits.success('no nation builder id');
    }

    const url = `https://goodparty.nationbuilder.com/api/v1/people/${nationBuilderId}/taggings?access_token=${nationBuilderAccessToken}`;
    const body = {
      tagging: ['dogs'],
    };

    const res = await axios({
      url,
      method: 'PUT',
      data: body,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    console.log('success');
    console.log(res.data);

    // update user record with the id from the crm

    return exits.success('ok');
  },
};
