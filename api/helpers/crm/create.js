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
    try {
      const { user } = inputs;

      const url = `https://goodparty.nationbuilder.com/api/v1/people?access_token=${nationBuilderAccessToken}`;
      const body = {
        person: {
          first_name: user.name
            .split(' ')
            .slice(0, -1)
            .join(' '),
          last_name: user.name
            .split(' ')
            .slice(-1)
            .join(' '),
          email: user.email,
          phone: user.phone,
          profile_image_url_ssl: user.avatar,
        },
      };

      const res = await axios({
        url,
        method: 'POST',
        data: body,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      // update user record with the id from the crm

      let metaData;
      const nationBuilderId = res.data.person.id;
      if (user.metaData && user.metaData !== '') {
        const parsedMeta = JSON.parse(user.metaData);
        metaData = {
          ...parsedMeta,
          nationBuilderId,
        };
      } else {
        metaData = { nationBuilderId };
      }

      await User.updateOne({ id: user.id }).set({
        metaData: JSON.stringify(metaData),
      });
      return exits.success('ok');
    } catch (err) {
      console.log('error at helpers/crm/create', err);
      return exits.badRequest({ message: 'Error', error: err });
    }
  },
};
