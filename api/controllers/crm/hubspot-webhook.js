module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'found',
    },

    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },

    notFound: {
      description: 'Not Found',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const payload = this.req.body;

      if (payload && payload.length > 0) {
        for (let i = 0; i < payload.length; i++) {
          let { objectId, propertyName, propertyValue } = payload[i];
          try {
            if (propertyName === 'incumbent' || propertyName === 'opponents') {
              await handleUpdateViability(
                objectId,
                propertyName,
                propertyValue,
              );
            } else {
              await handleUpdateCampaign({
                objectId,
                propertyName,
                propertyValue,
              });
            }
          } catch (error) {
            console.log('error at crm/hubspot-webhook', error);
            await sails.helpers.slack.errorLoggerHelper(
              'error at crm/hubspot-webhook',
              { error, payload: payload[i] },
            );
          }
        }
      }

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('error at crm/hubspot-webhook', e);
      return exits.badRequest();
    }
  },
};

async function handleUpdateViability(objectId, propertyName, propertyValue) {
  const campaign = await getCampaign(objectId);
  if (!campaign) {
    return;
  }
  let propertyType = 'numeric';
  if (propertyName === 'incumbent') {
    if (propertyValue === 'Yes') {
      propertyName = 'isIncumbent';
      propertyValue = true;
    } else {
      propertyName = 'isIncumbent';
      propertyValue = false;
    }
    propertyType = 'boolean';
  }
  if (propertyName === 'opponents') {
    propertyName = 'opponents';
    propertyValue = parseInt(propertyValue);
  }

  const campaignId = campaign.id;
  try {
    await sails.sendNativeQuery(`
      UPDATE public.pathtovictory AS p
        SET data = jsonb_set(
            p.data::jsonb,
            '{${propertyName}}',
            to_jsonb('${propertyValue}'::${propertyType})
        )
      WHERE p.campaign = '${campaignId}';
`);
  } catch (e) {
    await sails.helpers.slack.errorLoggerHelper('error at update viability', {
      e,
    });
  }
}

async function handleUpdateCampaign({ objectId, propertyName, propertyValue }) {
  const campaign = await getCampaign(objectId);
  if (!campaign) {
    return;
  }
  if (!campaign.data.hubSpotUpdates) {
    campaign.data.hubSpotUpdates = {};
  }
  campaign.data.hubSpotUpdates[propertyName] = propertyValue;
  const updatedCampaign = {
    data: campaign.data,
  };

  if (propertyName === 'verified_candidates' && !campaign.isVerified) {
    updatedCampaign.isVerified = propertyValue === 'Yes';
  }

  if (propertyName === 'pro_candidate' && !campaign.isPro) {
    updatedCampaign.isPro = propertyValue === 'Yes';
  }

  await Campaign.updateOne({ id: campaign.id }).set(updatedCampaign);
  await sails.helpers.fullstory.customAttr(campaign.user);
}

async function getCampaign(objectId) {
  try {
    let query = `SELECT *
      FROM public.campaign
      WHERE data->>'hubspotId' = '${objectId}';
  `;
    const sqlResponse = await sails.sendNativeQuery(query);
    results = sqlResponse?.rows[0];
    return results;
  } catch (e) {
    await sails.helpers.slack.errorLoggerHelper('error at get campaign', { e });
    return false;
  }
}
