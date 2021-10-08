/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const mailchimp = require('@mailchimp/mailchimp_marketing');
const apiKey = sails.config.custom.MAILCHIMP_API || sails.config.MAILCHIMP_API;
const server =
  sails.config.custom.MAILCHIMP_SERVER || sails.config.MAILCHIMP_SERVER;

mailchimp.setConfig({
  apiKey,
  server,
});
module.exports = {
  friendlyName: 'Update Candidate',

  description: 'Admin endpoint to edit a candidate.',

  inputs: {
    candidateId: {
      type: 'number',
      required: true,
    },
    update: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
  },
  async fn(inputs, exits) {
    try {
      const { candidateId, update } = inputs;
      const attr = {
        title: update.title,
        date: update.date,
        text: update.text,
        youtubeId: update.youtubeId,
        candidate: candidateId,
      };

      await CampaignUpdate.create(attr);

      const candidate = await Candidate.findOne({ id: candidateId });
      try {
        await notifySupporterForUpdates(candidate);
      } catch (e) {
        console.log('error sending update to mailchimp', e);
      }
      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('Error creating campaign updates', e);
      return exits.badRequest({ message: 'Error creating campaign updates' });
    }
  },
};

const notifySupporterForUpdates = async candidate => {
  const appBase = sails.config.custom.appBase || sails.config.appBase;
  const { id, data, firstName, lastName } = candidate || {};
  const { race } = JSON.parse(data);
  const { lists } = await mailchimp.lists.getAllLists();
  const listName =
    appBase === 'https://goodparty.org' ? 'Good Party' : 'Good Party Dev';
  const replyTo = 'ask@goodparty.org';
  const tgpList = lists.find(list => list.name === listName);
  const name = `${firstName} ${lastName} for ${race} ### ${id}`;
  const { segments } = await mailchimp.lists.listSegments(tgpList.id, {
    count: 1000,
  });
  let segment = segments.find(item => item.name === name);

  const subject = `Campaign update from ${firstName} ${lastName} for ${race}`;
  const body = `${firstName} ${lastName}, who you endorsed for ${race}, has posted an update about their campaign.`;
  const url = `${appBase}/candidate/${firstName}-${lastName}/${candidate.id}`;

  const { templates } = await mailchimp.templates.list();
  const templateName = `Template ### ${id}`;
  let template = templates.find(item => item.name === templateName);
  const { campaigns } = await mailchimp.campaigns.list();
  if (!template) {
    const sampleCampaign = campaigns.find(
      campaign => campaign.settings.title === 'Sample',
    );
    const sampleContent = await mailchimp.campaigns.getContent(
      sampleCampaign.id,
    );
    const { html } = sampleContent;
    template = await mailchimp.templates.create({
      name: templateName,
      html: html
        .replace('{{Content}}', body)
        .replace('{{Subject}}', subject)
        .replace('{{URL}}', url),
    });
  }

  const oldCampaigns = campaigns.filter(
    campaign =>
      campaign.status === 'sent' && campaign.settings.title === subject,
  );
  for (let i = 0; i < oldCampaigns.length; i++) {
    await mailchimp.campaigns.remove(oldCampaigns[i].id);
  }
  let campaign = await mailchimp.campaigns.create({
    type: 'regular',
    recipients: {
      segment_opts: {
        saved_segment_id: segment.id,
        match: 'any',
      },
      list_id: tgpList.id,
    },
    settings: {
      subject_line: subject,
      preview_text: subject,
      title: subject,
      template_id: template.id,
      from_name: 'Good Party',
      reply_to: replyTo,
      to_name: '*|FNAME|*',
      auto_footer: false,
      inline_css: true,
    },
  });
  await mailchimp.campaigns.send(campaign.id);
};
