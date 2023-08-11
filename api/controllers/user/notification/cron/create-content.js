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
        const key = `createGoals-${today}`;
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
        // const weeks = 1;

        if (weeks > 0 && weeks <= 12 && campaign) {
          // 12 weeks before election

          const content = contentByWeek(weeks);

          const notification = {
            type: 'content',
            title: content.title,
            subTitle: content.subTitle,
            link: '/dashboard/content',
            dueDate: nextWeek,
          };

          await Notification.create({
            isRead: false,
            data: notification,
            user: campaign.user?.id,
          });

          await sendEmail(weeks, campaign.user);
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

function contentByWeek(week) {
  if (!week) {
    return {};
  }
  const byWeek = {
    week12: {
      title: 'Social Media Blitz Begins!',
      subTitle: 'Craft compelling posts that speak to your mission',
    },
    week11: {
      title: "Let's Knock Some Doors!",
      subTitle: 'Develop engaging introductions for door knocking campaigns',
    },
    week10: {
      title: 'Time to Make Headlines!',
      subTitle: 'Respond to current events and hot topics',
    },
    week9: {
      title: 'Anticipate and Impress!',
      subTitle: 'Frame your campaign narrative',
    },
    week8: {
      title: 'Social Media Spotlight!',
      subTitle: 'Initiate polls and Q&As about key issues',
    },
    week7: {
      title: 'Your Constituents Await!',
      subTitle: 'Share your personal story and motivation for running',
    },
    week6: {
      title: "Let's Capture the Media Spotlight!",
      subTitle: 'Prepare responses to potential tough questions',
    },
    week5: {
      title: 'Connect and Convince on Social Media!',
      subTitle: 'Share major campaign updates and milestones',
    },
    week4: {
      title: 'Show Your Preparedness!',
      subTitle: 'Develop your debate strategy and points of rebuttal',
    },
    week3: {
      title: 'Your Vision for the Community!',
      subTitle: 'Share how the community will thrive under your leadership',
    },
    week2: {
      title: 'Final Stretch: Rally the Troops!',
      subTitle: 'Create persuasive get-out-the-vote messages',
    },
    week1: {
      title: 'One Week to Go: Every Moment Counts!',
      subTitle: 'Develop heartfelt messages to your supporters',
    },
  };
  return byWeek[`week${week}`];
}

async function sendEmail(weeks, user) {
  const byWeek = {
    week12: {
      subject: 'Social Media Blitz Begins!',
      focus: 'Social Media Posts',
      content: `
We're 12 weeks away from the big day. Let's kickstart your campaign with powerful social media posts. Engage your audience, share your message, and build anticipation. 
<br/><br/>
Use our "My Content" tool to:
<br/><br/>

<ul>
  <li>Craft compelling posts that speak to your mission</li>
  <li>Share insights into your campaign</li>
  <li>Start a conversation around key issues</li>
</ul>
      `,
    },
    week11: {
      subject: "Let's Knock Some Doors!",
      focus: 'Door-Knocking Scripts',
      content: `
There's nothing like a personal connection to earn a vote. Craft your door-knocking scripts to inspire every constituent you meet. 
<br/>
<br/>
  Use our "My Content" tool to:
  <ul> 
    <li>Develop engaging introductions</li>
    <li>Explain your platform in a relatable manner</li>
    <li>Handle common objections and questions</li>
  </ul>
      `,
    },
    week10: {
      subject: 'Time to Make Headlines!',
      focus: 'Press Releases',
      content: `
      It's time to make some noise in the media. Write press releases that grab attention and showcase your campaign's momentum. 
      <br/>
      <br/>
      Use our "My Content" tool to:
      <ul>
        <li>Highlight your campaign's achievements</li>
        <li>Share your plans for the upcoming weeks</li>
        <li>Respond to current events and hot topics</li>
      </ul>
      `,
    },
    week9: {
      subject: 'Anticipate and Impress!',
      focus: 'Press Inquiry Responses',
      content: `
      The media spotlight grows brighter as we move closer to election day. Prepare thoughtful responses to anticipated press inquiries.
      <br/>
      <br/>
      Use our "My Content" tool to:
      <ul>
        <li>Frame your campaign narrative</li>
        <li>Address potential criticisms</li>
        <li>Highlight your unique selling points</li>
      </ul>

      `,
    },
    week8: {
      subject: 'Social Media Spotlight!',
      focus: 'Engaging Social Media Content',
      content: `
      As the campaign heats up, your social media presence is key. Let's engage your audience with interactive and dynamic posts.
      <br/>
      <br/>
      Use our "My Content" tool to:
      <ul>
        <li>Initiate polls and Q&As about key issues</li>
        <li>Share testimonials from supporters</li>
        <li>Promote upcoming events and appearances</li>
      </ul>

      `,
    },
    week7: {
      subject: 'Your Constituents Await!',
      focus: 'Canvassing Speech',
      content: `
      Engage your constituents directly. Refine your canvassing speech to win hearts and votes.
      <br/>
      <br/>
      Use our "My Content" tool to:
      <ul>
        <li>Share your personal story and motivation for running</li>
        <li>Highlight the key issues of your platform</li>
        <li>Answer common questions and concerns</li>
      </ul>
      `,
    },
    week6: {
      subject: "Let's Capture the Media Spotlight!",
      focus: 'Media Interviews',
      content: `
      Prepare for media interviews. Be ready to captivate audiences with your compelling narrative and sound plans.
      <br/>
      <br/>
      Use our "My Content" tool to:
      <ul>
        <li>Develop concise and impactful talking points</li>
        <li>Prepare responses to potential tough questions</li>
        <li>Practice staying on message under pressure</li>
      </ul>
      `,
    },
    week5: {
      subject: 'Connect and Convince on Social Media!',
      focus: 'Influential Social Media Posts',
      content: `
        With only five weeks left, your social media should reflect the high stakes. Make every post count.
        <br/>
        <br/>
        Use our "My Content" tool to:
        <ul>
          <li>Share major campaign updates and milestones</li>
          <li>Address hot topics in your community or nation</li>
          <li>Engage followers with call-to-action posts</li>
        </ul>
      `,
    },
    week4: {
      subject: 'Show Your Preparedness!',
      focus: 'Forum & Town Hall Prep',
      content: `
        Debate season is here. Show your constituents that you're prepared and ready to lead.
        <br/>
        <br/>
        Use our "My Content" tool to:
        <ul>
          <li>Develop your debate strategy and points of rebuttal</li>
          <li>Practice your key messages and the delivery</li>
          <li>Prepare for post-debate press inquiries</li>
        </ul>
      `,
    },
    week3: {
      subject: 'Your Vision for the Community!',
      focus: 'Vision Re-Statement (Closing Argument)',
      content: `
        It's time to remind your constituents about your vision. Craft a comprehensive and inspiring vision statement.
        <br/>
        <br/>
        Use our "My Content" tool to:
        <ul>
          <li>Outline your plans and policies for the community</li>
          <li>Detail the changes you hope to bring</li>
          <li>Share how the community will thrive under your leadership</li>
        </ul>
      `,
    },
    week2: {
      subject: 'Final Stretch: Rally the Troops!',
      focus: 'Get-Out-The-Vote Messages',
      content: `
        We're nearing the finish line. Inspire your supporters and remind them of the importance of their vote.
        <br/>
        <br/>
        Use our "My Content" tool to:
        <ul>
          <li>Develop rousing rally speeches</li>
          <li>Create persuasive get-out-the-vote messages</li>
          <li>Highlight the difference that every single vote can make</li>
        </ul>
      `,
    },
    week1: {
      subject: 'One Week to Go: Every Moment Counts!',
      focus: 'Final Push Content',
      content: `
        With just one week left, every moment counts. Your final messages can make a world of difference.
        <br/>
        <br/>
        Use our "My Content" tool to:
        <ul>
          <li>Develop heartfelt messages to your supporters</li>
          <li>Highlight the journey of your campaign</li>
          <li>Share final reminders for voting day</li>
        </ul>
        You've got this, ${user.name}! We're with you every step of the way.
        <br/>
        <br/>
        Please feel free to reach out if you have any questions or need further assistance. Here's to a successful campaign!
        <br/>
        <br/>
        Best,
        <br/>
        The Good Party Team
      `,
    },
  };

  const variables = {
    name: `${user.name}`,
    focus: byWeek[`week${weeks}`].focus,
    content: byWeek[`week${weeks}`].content,
  };

  await sails.helpers.mailgun.mailgunTemplateSender(
    user.email,
    byWeek[`week${weeks}`].subject,
    'weekly-content',
    JSON.stringify(variables),
  );
}
