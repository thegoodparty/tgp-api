/* eslint-disable object-shorthand */

module.exports = {
  inputs: {
    key: {
      type: 'string',
      required: true,
    },
    subSectionKey: {
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
      const { key, subSectionKey, name } = inputs;

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }

      if (!campaign[subSectionKey]) {
        console.log('invalid subSectionKey', subSectionKey);
        return exits.badRequest();
      }

      if (!campaign[subSectionKey][key]) {
        console.log('invalid document key', key);
        return exits.badRequest();
      }

      campaign[subSectionKey][key]['name'] = name;

      await Campaign.updateOne({
        slug: campaign.slug,
      }).set({
        data: campaign,
      });
      return exits.success({ status: 'success' });
    } catch (e) {
      console.log('Error generating AI response', e);
      return exits.badRequest();
    }
  },
};
