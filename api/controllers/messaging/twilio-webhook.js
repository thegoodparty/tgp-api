const { MessagingResponse } = require('twilio').twiml;

module.exports = {
  friendlyName: 'Track Visit',
  inputs: {},
  exits: {
    success: { description: 'Created', responseType: 'ok' },
    badRequest: { description: 'Error creating', responseType: 'badRequest' },
  },
  async fn(inputs, exits) {
    try {
      const twiml = new MessagingResponse();
      const body = this.req.body?.Body;
      const from = this.req.body?.From;
      const digitsOnly = body?.replace(/\D+/g, '');

      const { user, metadata, campaign, campaigns } = await findUserAndCampaign(
        from,
      );

      // if body contains stop words update the opt-out in hubspot and update notification preferences.
      if (
        body.toLowerCase().includes('stop') ||
        body.toLowerCase().includes('end') ||
        body.toLowerCase().includes('quit') ||
        body.toLowerCase().includes('unsubscribe') ||
        body.toLowerCase().includes('cancel') ||
        body.toLowerCase().includes('remove') ||
        body.toLowerCase().includes('optout')
      ) {
        if (metadata?.hubspotId) {
          // unsubscribe sms in hubspot
          await sails.helpers.crm.updateSmsOptin(metadata.hubspotId);

          // update notification preferences
          const userObj = await User.findOne({ id: user.id });
          const metaData = JSON.parse(userObj.metaData);
          if (
            !metaData?.textNotification ||
            metaData.textNotification !== false
          ) {
            metaData.textNotification = false;
            await User.updateOne({ id: userObj.id }).set({
              metaData: JSON.stringify(metaData),
            });
          }
        } else {
          await sails.helpers.errorLoggerHelper(
            'Could not update hubspot with optout in twilio-webhook. No hubspot id found.',
            from,
          );
        }
      }

      if (!metadata?.lastSms) {
        throwError('We are sorry, we can not update your campaign.');
      }

      let message;

      if (digitsOnly === undefined) {
        message =
          'Please just reply with the number. If you have any questions please email jared@goodparty.org';
      } else {
        if (metadata.lastSms === 'doorKnocking') {
          message = await handleDoorKnocking(
            user,
            metadata,
            campaign,
            campaigns[0].id,
            digitsOnly,
          );
        } else if (metadata.lastSms === 'calls') {
          message = await handleCalls(
            user,
            metadata,
            campaign,
            campaigns[0].id,
            digitsOnly,
          );
        } else if (metadata.lastSms === 'digital') {
          message = await handleDigital(
            user,
            metadata,
            campaign,
            campaigns[0].id,
            digitsOnly,
          );
        } else {
          message = `you responded with ${body}. digits only is ${digitsOnly}`;
        }
      }

      twiml.message(message);
      return this.res.set('Content-Type', 'text/xml').send(twiml.toString());
    } catch (e) {
      console.log('Error at messaging/twilio-webhook', e);
      await sails.helpers.errorLoggerHelper(
        'Error at messaging/twilio-webhook',
        e,
      );
      const twiml = new MessagingResponse();
      twiml.message(e.message || 'Error at messaging/twilio-webhook');
      return this.res.set('Content-Type', 'text/xml').send(twiml.toString());
    }
  },
};

function throwError(message) {
  throw new Error(message);
}

async function findUserAndCampaign(from) {
  if (!from) {
    throwError('Sorry, we can not update your campaign.');
  }
  const cleanPhone = from.replace('+1', '');
  const users = await User.find({ phone: cleanPhone });
  if (users.length === 0) {
    throwError(`Sorry, we can not update your campaign.`);
  }

  const user = users[0];
  if (!user.metaData) {
    throwError('Sorry, we can not update your campaign.');
  }

  const metadata = JSON.parse(user.metaData);

  const campaigns = await Campaign.find({ user: user.id }).sort([
    { updatedAt: 'DESC' },
  ]);

  let campaign = false;
  if (campaigns && campaigns.length > 0) {
    campaign = campaigns[0].data;
  }
  if (!campaign) {
    throwError('Sorry, your campaign can not be updated.');
  }

  return { user, metadata, campaign, campaigns };
}

async function handleDoorKnocking(
  user,
  metadata,
  campaign,
  campaignId,
  digitsOnly,
) {
  if (!campaign.reportedVoterGoals) {
    campaign.reportedVoterGoals = { doorKnocking: 0, calls: 0, digital: 0 };
  }
  campaign.reportedVoterGoals.doorKnocking += parseInt(digitsOnly);

  await Campaign.updateOne({ id: campaignId }).set({ data: campaign });
  await User.updateOne({ id: user.id }).set({
    metaData: JSON.stringify({ ...metadata, lastSms: 'calls' }),
  });

  await CampaignUpdateHistory.create({
    type: 'doorKnocking',
    quantity: parseInt(digitsOnly),
    campaign: campaignId,
    user: user.id,
  });

  return 'Thank you! How many calls were made this week?';
}

async function handleCalls(user, metadata, campaign, campaignId, digitsOnly) {
  if (!campaign.reportedVoterGoals) {
    campaign.reportedVoterGoals = { doorKnocking: 0, calls: 0, digital: 0 };
  }
  campaign.reportedVoterGoals.calls += parseInt(digitsOnly);

  await Campaign.updateOne({ id: campaignId }).set({ data: campaign });
  await User.updateOne({ id: user.id }).set({
    metaData: JSON.stringify({ ...metadata, lastSms: 'digital' }),
  });

  await CampaignUpdateHistory.create({
    type: 'calls',
    quantity: parseInt(digitsOnly),
    campaign: campaignId,
    user: user.id,
  });

  return 'Thank you! How many online impressions were made this week?';
}

async function handleDigital(user, metadata, campaign, campaignId, digitsOnly) {
  if (!campaign.reportedVoterGoals) {
    campaign.reportedVoterGoals = { doorKnocking: 0, calls: 0, digital: 0 };
  }
  campaign.reportedVoterGoals.digital += parseInt(digitsOnly);

  await Campaign.updateOne({ id: campaignId }).set({ data: campaign });
  const updated = delete metadata.lastSms;
  await User.updateOne({ id: user.id }).set({
    metaData: JSON.stringify(updated),
  });

  await CampaignUpdateHistory.create({
    type: 'digital',
    quantity: parseInt(digitsOnly),
    campaign: campaignId,
    user: user.id,
  });

  return 'Thank you! your campaign is now updated!';
}
