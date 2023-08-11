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
      if (appBase === 'https://goodparty.org') {
        // make sure we run this only once a day
        const today = moment().format('YYYY-MM-DD');
        const key = `weeklyGoals-${today}`;
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

      const candidates = await Candidate.find();
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];

        const data = JSON.parse(candidate.data);
        const { electionDate, campaignOnboardingSlug } = data;
        if (!campaignOnboardingSlug) {
          // old candidates
          continue;
        }
        const campaign = await Campaign.findOne({
          slug: campaignOnboardingSlug,
        }).populate('user');
        if (!campaign || !campaign.data || !campaign.data.pathToVictory) {
          continue; // goals not set yet.
        }
        const now = moment(new Date());
        const nextWeek = moment().add(7, 'days').format('YYYY-MM-DD');
        const end = moment(electionDate);
        const duration = moment.duration(end.diff(now));
        const weeks = Math.floor(duration.asWeeks());
        // const weeks = 11;

        if (weeks >= 0 && weeks <= 12 && campaign) {
          for (let j = 0; j < fields.length; j++) {
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
          }
          // await sendEmail(goals, campaign.user);
        }
      }

      return exits.success({
        message: `notified ${candidates.length} candidates`,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error creating weekly goals',
      });
    }
  },
};

async function sendEmail(goals, user) {
  const { calls, digital, doorKnocking } = goals;
  if (
    calls.total <= calls.progress &&
    digital.total <= digital.progress &&
    doorKnocking.total <= doorKnocking.progress
  ) {
    //goals already reached
    return;
  }

  const variables = {
    name: `${user.name}`,
  };
  if (doorKnocking.total - doorKnocking.progress > 0) {
    variables.doorKnocking = `
      Your goal is to knock
      on ${numberFormatter(
        doorKnocking.total - doorKnocking.progress,
      )} doors this week. Engage with
      potential voters, discuss the issues that matter, and
      make your message heard.
    `;
  } else {
    variables.doorKnocking = 'up to date.';
  }

  if (calls.total - calls.progress > 0) {
    variables.calls = `
      We aim to reach
      ${numberFormatter(
        calls.total - calls.progress,
      )} people via phone calls or text messages this
      week. Personalized, direct communication can
      significantly impact a voter's decision.
    `;
  } else {
    variables.calls = 'up to date.';
  }

  if (digital.total - digital.progress > 0) {
    variables.digital = `
      Our digital goal
      for the week is to generate ${numberFormatter(
        digital.total - digital.progress,
      )} online
      impressions. This can be achieved through social media
      posts, email newsletters, and other online
      interactions. Remember, every digital interaction is
      an opportunity to connect with a potential voter.
    `;
  } else {
    variables.digital = 'up to date.';
  }

  await sails.helpers.mailgun.mailgunTemplateSender(
    user.email,
    'Your Campaign Goals for the Week',
    'weekly-goals',
    JSON.stringify(variables),
  );
}
