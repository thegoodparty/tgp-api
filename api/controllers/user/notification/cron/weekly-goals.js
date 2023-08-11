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
          // 12 weeks before election
          const goals = calculateGoals(campaign.data, weeks);
          const fields = [
            {
              key: 'doorKnocking',
              sentence1: 'Knock on',
              sentence2: 'doors this week',
            },
            {
              key: 'calls',
              sentence1: 'Make',
              sentence2: 'calls this week',
            },
            {
              key: 'digital',
              sentence1: 'Create online content for',
              sentence2: 'impressions this week',
            },
          ];

          for (let j = 0; j < fields.length; j++) {
            const { key, sentence1, sentence2 } = fields[j];
            const goal = goals[key];
            if (goal.total > goal.progress) {
              // goal is not complete, need to create notification
              const notification = {
                type: 'goal',
                title: `${sentence1} ${numberFormatter(
                  goal.total - goal.progress,
                )} ${sentence2}`,
                link: '/dashboard',
                subTitle: 'Campaign Tracker',
                dueDate: nextWeek,
              };

              await Notification.create({
                isRead: false,
                data: notification,
                user: campaign.user?.id,
              });
            }
          }
          await sendEmail(goals, campaign.user);
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

function calculateGoals(data, weeks) {
  const { pathToVictory, reportedVoterGoals } = data;
  const { voterContactGoal, voteGoal } = pathToVictory;
  const resolvedContactGoal = voterContactGoal ?? voteGoal * 5;
  const contactGoals = calculateContactGoals(resolvedContactGoal);
  const reportedGoals = {
    doorKnocking: reportedVoterGoals?.doorKnocking || 0,
    calls: reportedVoterGoals?.calls || 0,
    digital: reportedVoterGoals?.digital || 0,
  };
  const accumulatedTotal = calculateAccumulated(weeks, contactGoals);
  return {
    doorKnocking: {
      total: accumulatedTotal?.doorKnocking,
      progress: reportedGoals.doorKnocking,
    },
    calls: {
      total: accumulatedTotal?.calls,
      progress: reportedGoals.calls,
    },
    digital: {
      total: accumulatedTotal?.digital,
      progress: reportedGoals.digital,
    },
  };
}

function calculateContactGoals(total) {
  if (!total) {
    return false;
  }
  const totals = {
    week12: parseInt((total * 2.7) / 100, 10),
    week11: parseInt((total * 4.05) / 100, 10),
    week10: parseInt((total * 4.05) / 100, 10),
    week9: parseInt((total * 5.41) / 100, 10),
    week8: parseInt((total * 8.11) / 100, 10),
    week7: parseInt((total * 8.11) / 100, 10),
    week6: parseInt((total * 9.46) / 100, 10),
    week5: parseInt((total * 9.46) / 100, 10),
    week4: parseInt((total * 10.81) / 100, 10),
    week3: parseInt((total * 10.81) / 100, 10),
    week2: parseInt((total * 13.51) / 100, 10),
    week1: parseInt((total * 13.51) / 100, 10),
  };

  const totalGoals = {};
  Object.keys(totals).forEach((week) => {
    totalGoals[week] = {
      total: totals[week],
      doorKnocking: parseInt(totals[week] * 0.2),
      calls: parseInt(totals[week] * 0.35),
      digital: parseInt(totals[week] * 0.45),
    };
  });

  return totalGoals;
}

function calculateAccumulated(weeks, contactGoals) {
  let accumulatedTotal = {
    doorKnocking: 0,
    calls: 0,
    digital: 0,
  };
  if (weeks > 12) {
    return contactGoals.week12;
  }
  for (let i = 0; i < 13 - weeks; i++) {
    const key = `week${12 - i}`;
    accumulatedTotal.doorKnocking += contactGoals[key]?.doorKnocking || 0;
    accumulatedTotal.calls += contactGoals[key]?.calls || 0;
    accumulatedTotal.digital += contactGoals[key]?.digital || 0;
  }

  return accumulatedTotal;
}

function numberFormatter(num) {
  if (isNaN(num)) {
    return 0;
  }
  if (!num) return 0;
  if (typeof num !== 'number') {
    num = parseFloat(num);
  }
  return `${num
    .toFixed(0)
    .replace(/./g, (c, i, a) =>
      i && c !== '.' && (a.length - i) % 3 === 0 ? `,${c}` : c,
    )}`;
}

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
