const { USER_ROLES } = require('../../models/users/User');
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
      const userCampaign = await sails.helpers.campaign.byUser(user.id);

      // Only allow mismatched slugs for admins
      if (
        slug &&
        slug !== userCampaign.slug &&
        // TODO: these role authorization checks should be done at the
        //  routing/policy layer
        user?.role !== USER_ROLES.SALES &&
        !user.isAdmin
      ) {
        return exits.badRequest('Unauthorized');
      }

      let campaign = slug
        ? await Campaign.findOne({ slug }).populate('pathToVictory')
        : userCampaign;

      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      let updated = campaign;
      for (let i = 0; i < attr.length; i++) {
        const { key, value } = attr[i];
        const keyArray = key.split('.');
        if (keyArray.length <= 1 || keyArray.length > 3) {
          return exits.badRequest('key must be in the format of section.key');
        }

        const column = keyArray[0];
        const columnKey = keyArray[1];
        const columnKey2 = keyArray[2];

        if (column === 'pathToVictory') {
          if (columnKey === 'viability') {
            await updateViability(campaign, columnKey2, value);
          } else {
            await updatePathToVictory(campaign, columnKey, value);
          }
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
        await sails.helpers.crm.updateCampaign(
          updated !== false ? updated : campaign,
        );
      } catch (e) {
        sails.helpers.log(campaign.slug, 'error updating crm', e);
        await sails.helpers.slack.errorLoggerHelper(
          'Update Campaign - CRM update failed',
          e,
        );
      }

      try {
        await sails.helpers.fullstory.customAttr(user.id);
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

async function updatePathToVictory(campaign, columnKey, value) {
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
    console.log('Error at updatePathToVictory', e);
    await sails.helpers.slack.errorLoggerHelper(
      'Error at updatePathToVictory',
      e,
    );
  }
}

async function updateViability(campaign, columnKey, value) {
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
    const viability = data.viability || {};
    const updatedData = {
      ...data,
      viability: {
        ...viability,
        [columnKey]: value,
      },
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
    console.log('Error at updateViability', e);
    await sails.helpers.slack.errorLoggerHelper('Error at updateViability', e);
  }
}
