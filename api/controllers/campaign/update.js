module.exports = {
  friendlyName: 'Update Campaign',

  inputs: {
    key: {
      type: 'string',
      required: true,
    },
    value: {
      type: 'ref', // ref can accept any type.
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Campaign Updated',
      responseType: 'ok',
    },
    badRequest: {
      description: 'creation failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { key, value } = inputs;
      const { user } = this.req;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      const keyArray = key.split('.');
      if (keyArray.length <= 1 || keyArray.length > 2) {
        return exits.badRequest('key must be in the format of section.key');
      }

      campaign[keyArray[0]][keyArray[1]] = value;

      const updated = await Campaign.updateOne({
        id: campaign.id,
      }).set({
        [keyArray[0]]: campaign[keyArray[0]],
      });

      try {
        await sails.helpers.crm.updateCampaign(updated);
      } catch (e) {
        sails.helpers.log(slug, 'error updating crm', e);
      }

      return exits.success({
        campaign: updated,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('Error updating campaign', e);
      return exits.badRequest({ message: 'Error updating campaign.' });
    }
  },
};
