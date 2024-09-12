/* eslint-disable object-shorthand */

module.exports = {
  inputs: {
    key: {
      type: 'string',
      required: true,
    },

    name: {
      type: 'ref',
      required: true,
    },
  },

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
      const { key, name } = inputs;

      const campaign = await sails.helpers.campaign.byUser(user.id);

      const { aiContent } = campaign;

      if (!aiContent?.[key]) {
        console.log('invalid document key', key);
        return exits.badRequest();
      }

      aiContent[key]['name'] = name;

      await sails.helpers.campaign.patch(
        campaign.id,
        'aiContent',
        key,
        aiContent[key],
      );

      return exits.success({ status: 'success' });
    } catch (e) {
      console.log('Error generating AI response', e);
      return exits.badRequest();
    }
  },
};
