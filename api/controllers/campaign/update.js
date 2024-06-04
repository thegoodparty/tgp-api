module.exports = {
  friendlyName: 'Update Campaign',

  inputs: {
    attr: {
      type: 'json', // array of keys in the format of {key: section.key, value}.
      required: true,
    },
    slug: {
      type: 'string', // admin only
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
      const { attr, slug } = inputs;
      const { user } = this.req;
      if (slug && !user.isAdmin) {
        return exits.badRequest('Unauthorized');
      }
      let campaign;
      if (slug) {
        campaign = await Campaign.findOne({ slug }).populate('pathToVictory');
      } else {
        campaign = await sails.helpers.campaign.byUser(user);
      }
      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      let updated = campaign;
      for (let i = 0; i < attr.length; i++) {
        const { key, value } = attr[i];
        const keyArray = key.split('.');
        if (keyArray.length <= 1 || keyArray.length > 2) {
          return exits.badRequest('key must be in the format of section.key');
        }

        const column = keyArray[0];
        const columnKey = keyArray[1];

        if (column === 'pathToVictory') {
          await handlePathToVictory(campaign, columnKey, value);
        } else {
          updated = await sails.helpers.campaign.patch(
            campaign.id,
            column,
            columnKey,
            value,
          );
        }
      }

      try {
        await sails.helpers.crm.updateCampaign(updated);
      } catch (e) {
        sails.helpers.log(campaign.slug, 'error updating crm', e);
      }
      try {
        await sails.helpers.fullstory.customAttr(updated.id);
      } catch (e) {
        sails.helpers.log(campaign.slug, 'error updating fullstory', e);
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

async function handlePathToVictory(campaign, columnKey, value) {
  try {
    const p2v = await PathToVictory.findOrCreate(
      {
        campaign: campaign.id,
      },
      {
        campaign: campaign.id,
      },
    );

    const data = p2v.data || {};
    const updatedData = {
      ...data,
      [columnKey]: value,
    };

    await PathToVictory.updateOne({ id: p2v.id }).set({
      data: updatedData,
    });

    if (!campaign.pathToVictory) {
      await Campaign.updateOne({ id: campaign.id }).set({
        pathToVictory: p2v.id,
      });
    }
  } catch (e) {
    console.log('Error at handlePathToVictory', e);
    await sails.helpers.slack.errorLoggerHelper(
      'Error at handlePathToVictory',
      e,
    );
  }
}
