/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const fileExt = 'jpeg';
const mailchimp = require('@mailchimp/mailchimp_marketing');
const moment = require('moment');

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
    candidate: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Candidate Update',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Candidate update Failed',
      responseType: 'badRequest',
    },
  },
  async fn(inputs, exits) {
    try {
      const { candidate } = inputs;
      const { candidateUpdates } = candidate;
      delete candidate['updates'];
      delete candidate['updatesDates'];
      delete candidate['candidateUpdates'];
      const { id } = candidate;

      const cleanCandidate = {
        ...candidate,
        firstName: candidate.firstName.trim(),
        lastName: candidate.lastName.trim(),
        chamber: candidate.chamber.trim(),
        // image,
        isActive: !!candidate.isActive,
      };

      // delete cleanCandidate.imageBase64;
      const oldCandidate = await Candidate.findOne({ id }).populate(
        'candidateUpdates',
      );

      const updatedCandidate = await Candidate.updateOne({ id }).set({
        ...cleanCandidate,
      });
      // add the id to the JSON.stringified record
      await Candidate.updateOne({ id: updatedCandidate.id }).set({
        data: JSON.stringify({ ...cleanCandidate, id: updatedCandidate.id }),
      });
      try {
        let oldCandidateUpdates = oldCandidate.candidateUpdates;
        let isUpdated = false;
        for (let i = 0; i < oldCandidateUpdates.length; i++) {
          const updatedItem = candidateUpdates.find(
            item => item.id === oldCandidateUpdates[i].id,
          );
          if (oldCandidateUpdates[i].id && !updatedItem) {
            await CampaignUpdate.destroyOne({ id: oldCandidateUpdates[i].id });
          }
          if (updatedItem) {
            if (
              updatedItem.date !== oldCandidateUpdates[i].date ||
              updatedItem.text !== oldCandidateUpdates[i].text
            ) {
              await CampaignUpdate.updateOne({ id: updatedItem.id }).set({
                ...oldCandidateUpdates[i],
                ...updatedItem,
              });
            }
          }
        }
        const newItems = candidateUpdates.filter(item => !item.id);
        for (let i = 0; i < newItems.length; i++) {
          await CampaignUpdate.create({
            ...newItems[i],
            candidate: oldCandidate.id,
          }).fetch();
          isUpdated = true;
        }
        const oldData = JSON.parse(oldCandidate.data);
        if (isUpdated) {
          await notifySupporterForUpdates(updatedCandidate);
        }
        await sails.helpers.triggerCandidateUpdate(candidate.id);
        return exits.success({
          message: 'created',
        });
      } catch (e) {
        console.log('error sending notifications', e);
      }
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error registering candidate.' });
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
