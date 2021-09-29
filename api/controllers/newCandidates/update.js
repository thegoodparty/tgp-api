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
    appBase === 'https://goodparty.org' ? 'The Good Party' : 'goodparty';
  const replyTo = 'ask@goodparty.org';
  const tgpList = lists.find(list => list.name === listName);
  const name = `${firstName} ${lastName} for ${race} ### ${id}`;
  const { segments } = await mailchimp.lists.listSegments(tgpList.id, {
    count: 1000,
  });
  let segment = segments.find(item => item.name === name);

  const subject = `Campaign update from ${firstName} ${lastName} for ${race}`;
  const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
      <tbody>
        <tr>
          <td>
            <p
              style="
                font-size: 16px;
                font-family: Arial, sans-serif;
                margin-top: 0;
                margin-bottom: 5px;
              "
            >
              Hi *|FNAME|* !<br /><br />
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p
              style="
                font-size: 16px;
                font-family: Arial, sans-serif;
                margin-top: 0;
                margin-bottom: 5px;
              "
            >
            ${firstName} ${lastName}, who you endorsed for ${race}, has posted an update about their campaign.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p
              style="
                font-size: 16px;
                font-family: Arial, sans-serif;
                margin-top: 0;
                margin-bottom: 5px;
              "
            >
            <br />
            Tap the link below to read the update.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <br /><br /><a
              href="${appBase}/candidate/${firstName}-${lastName}/${candidate.id}"
              style="
                padding: 16px 32px;
                background: linear-gradient(
                    103.63deg,
                    rgba(255, 15, 19, 0.15) -3.51%,
                    rgba(191, 0, 32, 0) 94.72%
                  ),
                  linear-gradient(
                    257.82deg,
                    rgba(67, 0, 211, 0.25) -11.17%,
                    rgba(67, 0, 211, 0) 96.34%
                  ),
                  #5c00c7;
                color: #fff;
                font-size: 16px;
                border-radius: 8px;
                text-decoration: none;
              "
            >
              READ UPDATE
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  `;
  const html = `
  <style type="text/css">
    html, body {
    background: #EFEFEF;
    padding: 0;
    margin: 0;
    }
  </style>
  <table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF">
    <tr>
      <td width="100%" valign="top" align="center">
        <div
          style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          ${subject}
        </div>
        <center>
          <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
            <!-- START INTRO -->
            <tr>
              <td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td>
            </tr>
            <tr>
              <td>
                <table cellspacing="0" cellpadding="0" border="0" bgcolor="#FFFF" width="100%" style="max-width: 660px; background: #FFFF center center; background-size: cover;"
                  align="center">
  
                  <tr>
                    <td align="center" valign="top"
                      style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#484848; "
                      class="body-text">
                      <p
                        style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; padding:0 20px; margin:0; text-align: left"
                        class="body-text">
                        <br />
                        ${message}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- END INTRO -->
            <tr>
              <td style="text-align: center">
                <br /><br /><br /><br />
                <p
                  style="
                    font-style: italic;
                    font-weight: normal;
                    font-size: 16px;
                    line-height: 22px;
                    text-align: center;
                    color: #555555;
                    text-decoration: none;
                    margin-bottom: 0;
                  "
                >
                  Free software for free elections by
                </p>
              </td>
            </tr>
            <tr>
              <td style="text-align: center">
              <br />
                  <img
                    style="margin: 0 auto"
                    src="https://s3-us-west-2.amazonaws.com/assets.goodparty.org/new-heart.png"
                  />
              </td>
            </tr>
            <tr>
              <td style="text-align: center">
                <br /><br />
                <p
                  style="
                    font-weight: normal;
                    font-size: 11px;
                    line-height: 15px;
                    /* identical to box height, or 136% */
  
                    text-align: center;
                    letter-spacing: 0.5px;
  
                    /* Neutral/N40 - Faded Ink */
  
                    color: #666666;
                  "
                >
                  To stop receiving updates, you can remove this campaign from  <a href="https://thegoodparty.org/profile">
                  your endorsements
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </center>
      </td>
    </tr>
  </table>`;

  const { templates } = await mailchimp.templates.list();
  const templateName = `Template ### ${id}`;
  let template = templates.find(item => item.name === templateName);
  if (!template) {
    template = await mailchimp.templates.create({
      name: templateName,
      html,
    });
  }
  const { campaigns } = await mailchimp.campaigns.list();
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
