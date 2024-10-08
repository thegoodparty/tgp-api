const moment = require('moment');

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'found',
    },

    badRequest: {
      description: 'Error finding notification',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let count = 0;
      if (appBase === 'https://goodparty.org') {
        // make sure we run this only once a day
        const today = moment().format('YYYY-MM-DD');
        const key = `updateTracker-${today}`;
        const exists = await KeyValue.findOne({ key });
        if (exists) {
          return exits.badRequest({
            message: 'notification created today already.',
          });
        }
        await KeyValue.create({
          key,
          value: true,
        });
      }

      const campaigns = await Campaign.find({ isActive: true }).populate(
        'user',
      );
      for (let i = 0; i < campaigns.length; i++) {
        try {
          const campaign = campaigns[i];

          const electionDate = campaign.details?.electionDate;

          if (!campaign || !campaign.pathToVictory || !campaign.user) {
            continue; // goals not set yet.
          }

          if (!electionDate) {
            continue;
          }

          const now = moment(new Date());
          const nextWeek = moment().add(7, 'days').format('YYYY-MM-DD');
          const end = moment(electionDate);
          const duration = moment.duration(end.diff(now));
          const weeks = Math.floor(duration.asWeeks());
          // const weeks = 11;

          if (weeks >= 0 && weeks <= 12 && campaign) {
            const notification = {
              type: 'goal',
              title: 'Wrapping Up Your Week',
              link: '/dashboard',
              subTitle: 'Time to Update Your Campaign Tracker',
              dueDate: nextWeek,
            };

            await Notification.create({
              isRead: false,
              data: notification,
              user: campaign.user?.id,
            });
            const canEmail = await sails.helpers.notification.canEmail(
              campaign.user,
            );
            if (canEmail) {
              await sendEmail(campaign.user);
            }
            const canText = await sails.helpers.notification.canText(
              campaign.user,
            );

            if (canText) {
              const name = await sails.helpers.user.name(campaign.user);
              await sails.helpers.sms.sendSms(
                campaign.user.phone,
                `Hey ${name},

This is Jared from Good Party, checking in to update your Campaign Tracker, Doors Knocked - https://goodparty.org/dashboard

How many Doors did you knock this week?

REPLY with the number (ex: 170), any questions, or STOP to unsubscribe.`,
              );
              // save status to user meta data
              let metaData = campaign.user.metaData
                ? JSON.parse(campaign.user.metaData)
                : {};
              metaData.lastSms = 'doorKnocking';
              await User.updateOne({ id: campaign.user.id }).set({
                metaData: JSON.stringify(metaData),
              });
            }
            count++;
          }
        } catch (e) {
          console.log('error at update-tracker loop', e);
        }
      }

      return exits.success({
        message: `notified ${count} candidates`,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('Error updating tracker', e);
      return exits.badRequest({
        message: 'Error updating tracker',
        e,
      });
    }
  },
};

async function sendEmail(user) {
  if (!user) {
    return;
  }
  const name = await sails.helpers.user.name(user);
  const variables = {
    name: `${name}`,
  };

  await sails.helpers.mailgun.mailgunTemplateSender(
    user.email,
    'Wrapping Up Your Week - Time to Update Your Campaign Tracker',
    'update-tracker',
    variables,
  );
}
