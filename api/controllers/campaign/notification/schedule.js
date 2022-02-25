/**
 * candidateIssue/schedule.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
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
  friendlyName: 'Schedule Notification',

  description: 'Campaign Notification endpoint to schedule Campaign Notification',

  inputs: {
  },
  exits: {
    success: {
      description: 'scheduling',
      responseType: 'ok',
    },
    badRequest: {
      description: 'error finding',
      responseType: 'badRequest',
    },

    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },
  async fn(inputs, exits) {
    try {
      const campaignNotifications = await CampaignNotification.find();
      for(let i = 0; i < campaignNotifications.length; i++) {
        scheduleCampaignNotification(campaignNotifications[i])
      }
      return exits.success(campaignNotifications);
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error notification schedule issue.' });
    }
  },
};
const nextWeekDay = weekday => {
  const dayINeed = weekday; // for Thursday
  const today = moment().isoWeekday();

  // if we haven't yet passed the day of the week that I need:
  if (today <= dayINeed) { 
    // then just give me this week's instance of that day
    return moment().isoWeekday(dayINeed);
  } else {
    // otherwise, give me *next week's* instance of that same day
    return moment().add(1, 'weeks').isoWeekday(dayINeed);
  }
}
const scheduleCampaignNotification = async (notificationSetting) => {
  const candidate = await Candidate.findOne({ id: notificationSetting.candidate });
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
  if(!segment) {
    return;
  }
  const subject = `Notification for the campaign from ${firstName} ${lastName} for ${race}`;

  const { templates } = await mailchimp.templates.list();
  const templateName = `Notification Template ### ${id}`;
  let template = templates.find(item => item.name === templateName);
  const { campaigns } = await mailchimp.campaigns.list();
  if (template) {
    await mailchimp.templates.deleteTemplate(template.id);
  }
  template = await mailchimp.templates.create({
    name: templateName,
    html: notificationSetting.template
  });

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
  const nextScheduleDate = nextWeekDay(notificationSetting.weekday);
  const res = await mailchimp.campaigns.schedule(campaign.id, {
    schedule_time: nextScheduleDate
  });
};
