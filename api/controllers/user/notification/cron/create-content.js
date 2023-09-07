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
        let { electionDate, campaignOnboardingSlug } = data;
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

        if (!electionDate && campaign.data.goals?.electionDate) {
          electionDate = campaign.data.goals?.electionDate;
          await Candidate.updateOne({
            data: JSON.stringify({
              ...data,
              electionDate,
            }),
          });
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
          count++;
          const canEmail = await sails.helpers.notification.canEmail(
            campaign.user,
          );
          if (canEmail) {
            await sendEmail(weeks, campaign.user);
          }
        }
      }

      return exits.success({
        message: `notified ${count} candidates`,
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

const m = {
  slug: 'matthew-wardenaar',
  details: {
    firstName: 'Matthew',
    lastName: 'Wardenaar',
    zip: '92656',
    dob: '1984-04-27',
    citizen: 'yes',
    party: 'Independent',
    otherParty: '',
    knowRun: 'yes',
    state: 'CA',
    office: 'City Council',
    district: 'Aliso Viejo',
    articles: '',
    runBefore: 'no',
    officeRunBefore: '',
    pastExperience:
      'Throughout my career, I have been fortunate to work in various industries and roles, ranging from mobile app development to product management at leading companies like Apple, Turo, Dollar Shave Club, and Myspace. These experiences have equipped me with valuable skills in leadership, communication, and problem-solving. I have successfully managed numerous projects and teams, leading to the creation and launch of over 40 mobile apps and 22 mobile sites.\n\nIn addition to my professional achievements, I am passionate about giving back to the community. As a resident of Aliso Viejo, I care deeply about the future of our city and its residents. I have always been interested in public service, and I believe that my background in business strategy, project management, and marketing can be beneficial in addressing the challenges our city faces.\n\nI want to run for city council in Aliso Viejo to leverage my skills and experiences to make a meaningful impact on the community. I aim to support policies and initiatives that will foster sustainable economic growth, improve our infrastructure, and enhance the quality of life for all residents. Moreover, I am committed to engaging with the community, understanding their concerns, and working collaboratively to find innovative solutions to the issues we face.\n\nIn summary, my passion for public service, coupled with my professional expertise and leadership skills, make me a strong candidate for the Aliso Viejo City Council. I am excited about the opportunity to contribute to the betterment of our city and serve the people of Aliso Viejo.',
    occupation: 'Product Manager',
    funFact:
      "I have a penchant for learning and performing magic tricks. Over the years, I have honed my skills as an amateur magician, and I often enjoy entertaining friends, family, and colleagues at gatherings and events. It's a great way for me to break the ice, connect with people, and bring a little extra fun and excitement into social situations.",
    topIssues: {
      positions: [
        {
          createdAt: 1649095556912,
          updatedAt: 1658420397139,
          id: 13,
          name: 'Wealth Tax',
          topIssue: null,
        },
        {
          createdAt: 1649095557329,
          updatedAt: 1649095557329,
          id: 101,
          name: 'Breakup Monopolies',
          topIssue: {
            createdAt: 1649095557324,
            updatedAt: 1649095557324,
            id: 24,
            name: 'Business',
          },
        },
        {
          createdAt: 1649095557376,
          updatedAt: 1649095557376,
          id: 110,
          name: 'Congressional Stock Ban',
          topIssue: {
            createdAt: 1649095557367,
            updatedAt: 1649095557367,
            id: 26,
            name: 'Economy',
          },
        },
      ],
      'position-110':
        "I believe that public officials should be held to the highest standards of integrity and transparency, and this includes members of Congress. The trust of the public is paramount in maintaining a functional and accountable government.\n\nThat being said, I support the idea of a Congressional Stock Ban. This would entail prohibiting members of Congress from trading individual stocks while in office, to avoid conflicts of interest and even the appearance of impropriety. Instead, they could invest in diversified funds or other investment vehicles that don't create a conflict between their personal financial interests and their duty to serve the public.\n\nAs a city council member, I wouldn't have direct influence over this federal legislation. However, I would advocate for similar measures at the local level to ensure that our elected officials in Aliso Viejo maintain a high level of integrity and transparency. I believe that it is important for those in public office to prioritize the public interest above personal gain, and a stock ban would be a step in the right direction toward achieving that goal.",
      'position-101':
        'I believe that a competitive marketplace is essential for fostering innovation, consumer choice, and economic growth. When monopolies or oligopolies dominate an industry, it can stifle competition and lead to higher prices, reduced quality, and fewer options for consumers.\n\nAs a city council member, my influence on breaking up monopolies at the national or international level would be limited. However, I would work within my capacity to promote fair competition and support local businesses in Aliso Viejo. Encouraging small businesses to thrive and ensuring that they have a level playing field is a vital part of maintaining a healthy local economy.\n\nAt the same time, I understand that collaboration and cooperation can lead to innovation and economies of scale. Therefore, I would advocate for a balanced approach that recognizes the benefits of both competition and collaboration while safeguarding consumer interests and promoting overall economic growth.',
      'position-13':
        "it can be an effective tool to address income inequality and provide additional funding for essential public services. However, it's crucial to implement it in a balanced and thoughtful manner to avoid discouraging entrepreneurship and innovation. When considering a wealth tax, we need to take into account its potential impact on economic growth, job creation, and the overall business environment. My primary focus is on ensuring that our community thrives, and I believe that any tax policy should be evaluated based on its ability to promote fairness, support social programs, and contribute to a healthy economy.",
    },
    pledged: true,
  },
  goals: {
    filedStatement: 'no',
    campaignCommittee: '',
    electionDate: '2024-11-05',
    runningAgainst: [
      {
        name: 'TIFFANY ACKLEY',
        description:
          'Tiffany Ackley was elected to the Aliso Viejo City Council in 2018. She served as Mayor in 2021 and as Mayor Pro Term in 2020.\n\nTiffany has called South Orange County home since 1980, having attended local public schools from elementary level to high school. When it came time to settle down, her family knew where they wanted to live–Aliso Viejo.\n\nTiffany graduated Scripps College with a Bachelor of Arts in legal studies.  At Scripps, she was on the honor roll and elected to environmental and community service chairs by her peers.  Following college, Tiffany earned a Master of Business Administration at SDA Bocconi in Italy. While at Bocconi, she was elected student body President and was in the top 10% of her graduating class.\n\nAfter receiving her MBA, Tiffany attended the University of San Diego School of Law. While in law school she was invited to write for the International Law Journal, Law Review, and to be a member of Phi Delta Phi (an International Legal Honor Society). She graduated with top honors in her negotiations class and authored several articles for the school’s legal newspaper. Tiffany was also invited and attended the Institute on international legal studies with Supreme Court Justice Anthony Kennedy.\n\nAs an attorney, Tiffany has developed an expertise in representing small cities and water districts throughout California.  In 2015, she was named a super lawyer rising star in Southern California. Tiffany was also named as a top woman attorney in Southern California by Los Angeles Magazine.\n\nFor Aliso Viejo, Tiffany was appointed to represent the City for California JPIA, Coastal Greenbelt Authority, and South Orange County Watershed Management Area for 2021, 2020, and 2019. She also represented the city in the San Joaquin Hills TCA (as alternate) for 2019.\n\nTiffany is proud to call Aliso Viejo home.  It is why she chose to remain and start her family here. It is Tiffany’s sincere hope that her children, Laurel and Keith, have that same sense of civic pride as they grow older, and that they decide to call Aliso Viejo home when it’s time for them to start their own families.',
        party: 'Other',
      },
    ],
  },
  campaignPlanStatus: {
    policyPlatform: 'completed',
    operationalPlan: 'processing',
    communicationsStrategy: 'completed',
    getOutTheVote: 'completed',
    slogan: 'completed',
    timeline: 'processing',
    mobilizing: 'completed',
    pathToVictory: 'completed',
    why: 'completed',
    aboutMe: 'completed',
    messageBox: 'completed',
    launchEmail: 'completed',
    meetGreetEventAssets: 'completed',
    fundrasingEmail: 'completed',
    candidateWebsite: 'completed',
    launchSocialMediaCopy: 'completed',
    launchSpeech: 'completed',
    launchVideoScript: 'completed',
    pressRelease: 'processing',
    notificationEmailUpdate: 'completed',
    fundrasingEmail2: 'completed',
    religousAssemblyIntroduction: 'completed',
    religousAssemblyIntroduction2: 'completed',
    doorKnockingScript: 'completed',
    socialMediaCopy2: 'completed',
    socialMediaCopy3: 'completed',
    socialMediaCopy4: 'completed',
  },
  campaignPlan: {
    slogan:
      '"Magician-in-Charge: Abracadabra-ing progress and laughs in Aliso Viejo!"',
    operationalPlan:
      "<div>\n  <h2>12-Month Budget Plan for Matthew Wardenaar's City Council Campaign</h2>\n  <table>\n    <thead>\n      <tr>\n        <th>Month</th>\n        <th>Fundraising</th>\n        <th>Staffing and Overhead</th>\n        <th>Voter Contact</th>\n        <th>Total Spending</th>\n        <th>Cumulative Funds Raised</th>\n        <th>Cumulative Funds Spent</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td>January</td>\n        <td>0</td>\n        <td>1,500</td>\n        <td>3,000</td>\n        <td>4,500</td>\n        <td>0</td>\n        <td>4,500</td>\n      </tr>\n      <tr>\n        <td>February</td>\n        <td>3,000</td>\n        <td>1,500</td>\n        <td>4,500</td>\n        <td>6,000</td>\n        <td>3,000</td>\n        <td>10,500</td>\n      </tr>\n      <tr>\n        <td>March</td>\n        <td>6,000</td>\n        <td>1,500</td>\n        <td>6,000</td>\n        <td>7,500</td>\n        <td>9,000</td>\n        <td>18,000</td>\n      </tr>\n      <tr>\n        <td>April</td>\n        <td>9,000</td>\n        <td>1,500</td>\n        <td>7,500</td>\n        <td>9,000</td>\n        <td>18,000</td>\n        <td>27,000</td>\n      </tr>\n      <tr>\n        <td>May</td>\n        <td>12,000</td>\n        <td>1,500</td>\n        <td>9,000</td>\n        <td>10,500</td>\n        <td>30,000</td>\n        <td>37,500</td>\n      </tr>\n      <tr>\n        <td>June</td>\n        <td>15,000</td>\n        <td>1,500</td>\n        <td>12,000</td>\n        <td>13,500</td>\n        <td>45,000</td>\n        <td>51,000</td>\n      </tr>\n      <tr>\n        <td>July</td>\n        <td>18,000</td>\n        <td>1,500</td>\n        <td>15,000</td>\n        <td>16,500</td>\n        <td>63,000</td>\n        <td>67,500</td>\n      </tr>\n      <tr>\n        <td>August</td>\n        <td>21,000</td>\n        <td>1,500</td>\n        <td>18,000</td>\n        <td>19,500</td>\n        <td>84,000</td>\n        <td>87,000</td>\n      </tr>\n      <tr>\n        <td>September</td>\n        <td>40,500</td>\n        <td>4,500</td>\n        <td>31,500</td>\n        <td>36,000</td>\n        <td>124,500</td>\n        <td>123,000</td>\n      </tr>\n      <tr>\n        <td>October</td>\n        <td>0</td>\n        <td>1,500</td>\n        <td>0</td>\n        <td>1,500</td>\n        <td>124,500</td>\n        <td>124,500</td>\n      </tr>\n      <tr>\n        <td>November</td>\n        <td>0</td>\n        <td>1,500</td>\n        <td>0</td>\n        <td>1,500</td>\n        <td>124,500</td>\n        <td>126,000</td>\n      </tr>\n      <tr>\n        <td>December</td>\n        <td>0</td>\n        <td>1,500</td>\n        <td>0</td>\n        <td>1,500</td>\n        <td>124,500</td>\n        <td>127,500</td>\n      </tr>\n    </tbody>\n  </table>\n  \n  <h3>Hiring Plan</h3>\n  <ul>\n    <li>Campaign Manager: Starting in January with a salary of $5,000 per month</li>\n    <li>Campaign Treasurer: Starting in January with a salary of $2,500 per month</li>\n    <li>Field Organizer: Starting in March with a salary of $2,500 per month</li>\n  </ul>\n  \n  <p>Total number of paid field shifts will be determined based on the percentage of available funds dedicated to voter contact. Staffing and overhead will not exceed 40% of overall spending.</p>\n</div>",
    timeline:
      '<h2>Campaign Plan Timeline for Matthew Wardenaar</h2>\n<p>In order to achieve a successful campaign for City Council, Matthew Wardenaar will follow the campaign plan timeline as shown below:</p>\n\n<table class="table-auto">\n  <thead>\n    <tr>\n      <th class="px-4 py-2">Activity</th>\n      <th class="px-4 py-2">Date</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td class="border px-4 py-2">Election Day</td>\n      <td class="border px-4 py-2">September 16, 2023</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">Get Out the Vote (GOTV)</td>\n      <td class="border px-4 py-2">September 2-15, 2023</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">Early Voting Begins</td>\n      <td class="border px-4 py-2">August 17, 2023</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">Voter Registration Deadline</td>\n      <td class="border px-4 py-2">August 4, 2023</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">Campaign Launch</td>\n      <td class="border px-4 py-2">June 25, 2023</td>\n    </tr>\n  </tbody>\n</table>\n\n<h2>Political Calendar and Timeline for Matthew Wardenaar\'s Campaign</h2>\n<p>The following political calendar and timeline has been created for Matthew Wardenaar\'s campaign:</p>\n\n<table class="table-auto">\n  <thead>\n    <tr>\n      <th class="px-4 py-2">Week</th>\n      <th class="px-4 py-2">Activity</th>\n      <th class="px-4 py-2">Communication Opportunity/Earned Media</th>\n      <th class="px-4 py-2">Voter Contact Goals</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td class="border px-4 py-2">12</td>\n      <td class="border px-4 py-2">Campaign Launch</td>\n      <td class="border px-4 py-2">Press release, social media announcement, campaign website launch</td>\n      <td class="border px-4 py-2">Create list of independents in jurisdiction</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">11</td>\n      <td class="border px-4 py-2">Campaign Strategy Development</td>\n      <td class="border px-4 py-2">None</td>\n      <td class="border px-4 py-2">Assess volunteers for voter outreach efforts</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">10</td>\n      <td class="border px-4 py-2">Voter ID and Outreach</td>\n      <td class="border px-4 py-2">Create campaign literature, social media posts, and campaign ads</td>\n      <td class="border px-4 py-2">Begin phone banking and door knocking efforts to reach Independents</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">9</td>\n      <td class="border px-4 py-2">Fundraising Campaign</td>\n      <td class="border px-4 py-2">Hold fundraising event, press releases, social media outreach</td>\n      <td class="border px-4 py-2">Call Independents to request campaign contributions</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">8</td>\n      <td class="border px-4 py-2">Voter Contact</td>\n      <td class="border px-4 py-2">Released campaign literature and social media posts</td>\n      <td class="border px-4 py-2">Hold community meetings to reach out to more Independents</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">7</td>\n      <td class="border px-4 py-2">Media Outreach</td>\n      <td class="border px-4 py-2">Pitch to local media outlets for interviews and story coverage on the campaign</td>\n      <td class="border px-4 py-2">Focus on independent voters who are leaning towards the campaign agenda</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">6</td>\n      <td class="border px-4 py-2">Voter Registration Drive</td>\n      <td class="border px-4 py-2">Hold voter registration events, offer literature and flyers to locals and post on social media</td>\n      <td class="border px-4 py-2">Follow-up with registered Independents and remind them of key dates</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">5</td>\n      <td class="border px-4 py-2">Voter Contact</td>\n      <td class="border px-4 py-2">Post on social media, do phonebanking, and door-knocking efforts</td>\n      <td class="border px-4 py-2">Have personal conversations with undecided Independents</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">4</td>\n      <td class="border px-4 py-2">Early Voter Drives</td>\n      <td class="border px-4 py-2">Advertise early voting dates and times on social media, in flyers and post items in public posts</td>\n      <td class="border px-4 py-2">Remind supporters to urge their friends to vote early</td>\n    </tr>\n    <tr>\n      <td class="border px-4 py-2">3</td>\n      <td class="border px-4 py-2">Get Out the Vote (GOTV)</td>\n      <td class="border px-4 py-2">Social media, press releases and ads to remind about GOTV</td>\n      <td class="border px-4 py-2">Volunteers will focus on conversations with independents who have not yet voted</td>\n    </tr>\n  </tbody>\n</table>',
    communicationsStrategy:
      '<div>\n\n<h2>Situation Analysis</h2>\n<ul class="list-disc ml-6">\n    <li>The political landscape in Aliso Viejo is currently divided between Independent and Republican parties.</li>\n    <li>The key issues in the race include economic growth, infrastructure improvement, and enhancing the quality of life for residents.</li>\n    <li>The campaign needs to address the concerns of voters in a balanced and thoughtful manner to gain their support.</li>\n</ul>\n\n<h2>Target Audience</h2>\n<ul class="list-disc ml-6">\n    <li>The target audiences for the campaign are independent and moderate voters in Aliso Viejo.</li>\n    <li>The campaign should focus on residents who care about economic growth, infrastructure improvement, and enhancing the quality of life for all residents</li>\n    <li>The best channels to reach them are social media, local events, and direct mail campaigns.</li>\n</ul>\n\n<h2>Message Development</h2>\n<p>\n    Matthew Wardenaar\'s message will focus on using his experience in business strategy, project management, and marketing to tackle the challenges facing Aliso Viejo. His vision includes a plan to create sustainable economic growth, improve infrastructure, and enhance the quality of life for all residents. He will emphasize his dedication to community engagement and collaboration to find innovative solutions to the issues facing the city. \n</p>\n\n<h2>Media Relations</h2>\n<ul class="list-disc ml-6">\n    <li>The campaign will build relationships with local journalists and media outlets.</li>\n    <li>The campaign will identify opportunities for media coverage in local news outlets.</li>\n    <li>The campaign will develop press releases, talking points, and other materials to support media outreach.</li>\n</ul>\n\n<h2>Digital Strategy</h2>\n<ul class="list-disc ml-6">\n    <li>The digital strategy will include a focus on social media to reach potential voters in Aliso Viejo.</li>\n    <li>The campaign will create compelling digital content, including videos and graphics, for social media campaigns.</li>\n    <li>The campaign will utilize online platforms to engage with supporters, reach new audiences, and mobilize volunteers.</li>\n</ul>\n\n<h2>Events and Rallies</h2>\n<ul class="list-disc ml-6">\n    <li>The campaign will organize public events, rallies, and other activities to generate enthusiasm for the campaign and mobilize supporters.</li>\n    <li>The events will be designed to connect with people in the community, encourage voter engagement and support for Matthew Wardenaar.</li>\n</ul>\n\n<h2>Fundraising</h2>\n<ul class="list-disc ml-6">\n    <li>The fundraising strategy will identify fundraising goals, develop fundraising materials, and identify potential donors and fundraising opportunities.</li>\n    <li>The campaign will seek donations from individuals and local businesses and utilize crowdfunding platforms to raise funds.</li>\n    <li>The campaign will prioritize transparency and will regularly report on its fundraising activities to its supporters in Aliso Viejo.</li>\n</ul>\n\n</div>',
    mobilizing:
      "<div>\n  <h2>Voter Targeting:</h2>\n  <p>To reach Matthew Wardenaar's base voters, we will target Independents, Democrats, and a small number of Republicans who prioritize his key issues. The key issues that we need to emphasize are Wealth Tax, Breakup Monopolies, and Congressional Stock Ban. </p>\n  <p>The group of voters that we are most likely to persuade to support our candidate are young adults and seniors who are interested in progressive changes to the current political system. We should also focus on middle-income and wealthy individuals who support policies that promote economic equality.</p>\n  <p>We should avoid targeting the opponent's voters as they are unlikely to switch sides.</p>\n  <p>In terms of demographics, our outreach efforts should focus on both men and women of all ages.</p>\n</div>\n\n<div>\n  <h2>Canvassing Strategy:</h2>\n  <p>Starting from 6 months prior to the election day, we need to establish weekly door knocking goals. Based on a shift of 4 hours of canvasing, and 100 doors knocked per hour, the weekly goal should be 200 doors per candidate. As the election draws closer, we need to increase our efforts and try to reach out to as many people as possible.</p>\n  <p>We should recruit and train volunteers to help us with canvassing. They should be provided with scripts and literature to help them communicate with potential voters. We should also provide training on how to handle different scenarios including how to answer questions and objections raised by voters.</p>\n</div>\n\n<div>\n  <h2>Phone Banking:</h2>\n  <p>Starting from 6 months prior to the election day, we need to establish weekly phone call goals. Based on a shift of 4 hours and 12 contacts per hour, we should target making 48 calls per candidate per week. As the election draws closer, we should increase our efforts and try to reach out to as many people as possible.</p>\n  <p>We should recruit and train volunteers to help us with phone banking. They should be provided with scripts and relevant information on the issues to discuss with voters. We should also provide training on how to handle different scenarios including how to answer questions and objections raised by voters. </p>\n</div>\n\n<div>\n  <h2>Voter Registration:</h2>\n  <p>We need to identify potential voters who are not registered to vote in the zip code 92656 and provide them with information about the registration process. We can do this by partnering with community organizations that work to register voters. We should also set up registration booths at community events such as farmers market or at high traffic public spaces like the malls.</p>\n</div>\n\n<div>\n  <h2>Get-Out-The-Vote (GOTV):</h2>\n  <p>We need to plan a GOTV strategy that will remind supporters about the election day, encourage them to vote and provide them with the relevant information about polling locations and hours. We could set up a phone bank specifically for GOTV or canvass doors and provide them with the information. We should also provide transportation to the polls if necessary.</p>\n  <p>To increase supportive voter turnout by 2%-5%, we should involve supporters in campaign events such as rallies, debates and other community events. These events should be inclusive and allow for supporters to share their ideas and feedback. </p>\n</div>\n\n<div>\n  <h2>Data Management:</h2>\n  <p>We need to track all the relevant voter contact information, canvassing results, voter preferences, and other relevant data in a database. This will help us target our efforts more effectively, identify voter trends and adjust accordingly. We can acquire data from voter registration, surveys, social media and other relevant channels.</p>\n</div>",
    policyPlatform:
      '<div class="bg-gray-100 p-5">\n  <h1 class="text-2xl font-bold">Matthew Wardenaar\'s Policy Platform</h1>\n  \n  <h2 class="text-xl font-semibold mt-5">Wealth Tax</h2>\n  <ul class="list-disc list-inside">\n    <li>A balanced approach to implementing a wealth tax is necessary</li>\n    <li>Consider potential impact on economic growth, job creation, and business environment</li>\n    <li>Evaluate tax policy based on ability to promote fairness, support social programs, and contribute to a healthy economy</li>\n  </ul>\n  \n  <h2 class="text-xl font-semibold mt-5">Breakup Monopolies</h2>\n  <ul class="list-disc list-inside">\n    <li>A competitive marketplace is essential for innovation, consumer choice, and economic growth</li>\n    <li>Encourage small businesses to thrive and ensure a level playing field</li>\n    <li>Advocate for a balanced approach that recognizes benefits of competition and collaboration</li>\n  </ul>\n  \n  <h2 class="text-xl font-semibold mt-5">Congressional Stock Ban</h2>\n  <ul class="list-disc list-inside">\n    <li>Public officials should be held to the highest standards of integrity and transparency</li>\n    <li>Prohibit members of Congress from trading individual stocks while in office to avoid conflicts of interest</li>\n    <li>Advocate for similar measures at the local level to maintain a high level of integrity and transparency in Aliso Viejo government</li>\n  </ul>\n  \n  <h2 class="text-xl font-semibold mt-5">Top 3 Issues in Zip Code 92656</h2>\n  <ol class="list-decimal list-inside">\n    <li>Lack of affordable housing options</li>\n    <li>Traffic congestion on main thoroughfares and parallel streets</li>\n    <li>Need for improved infrastructure and maintenance of public parks and facilities</li>\n  </ol>\n</div>',
    getOutTheVote:
      '<div>\n  <h2 class="text-xl font-bold mb-4">Get Out the Vote Tactics for Matthew Wardenaar</h2>\n  \n  <h3 class="text-lg font-bold mb-2">1. Door-to-Door Canvassing</h3>\n  <p class="mb-4">Organize a team of volunteers to go door-to-door in the community to promote Matthew\'s campaign and encourage people to vote. This will help increase awareness of the election and motivate people to get out and vote on election day.</p>\n  \n  <h3 class="text-lg font-bold mb-2">2. Social Media Campaign</h3>\n  <p class="mb-4">Develop a targeted social media campaign to reach potential voters. This can include ads on Facebook and Instagram, as well as organic posts highlighting Matthew\'s platform and stance on key issues.</p>\n  \n  <h3 class="text-lg font-bold mb-2">3. Public Events</h3>\n  <p class="mb-4">Host public events, such as rallies and meet-and-greets, to engage with voters in person. This will help people put a face to Matthew\'s name and see his passion for improving the community.</p>\n  \n  <h3 class="text-lg font-bold mb-2">4. Phone and Text Banking</h3>\n  <p class="mb-4">Utilize phone and text banking to reach out to potential voters and remind them of the upcoming election. This is a great way to ensure that voters don\'t forget to cast their ballot on election day.</p>\n  \n  <h3 class="text-lg font-bold mb-2">5. Volunteer Recruitment</h3>\n  <p class="mb-4">Encourage supporters to become volunteers and help spread the word about Matthew\'s campaign. This can include asking supporters to bring friends and family to events, as well as sharing campaign materials on social media.</p>\n  \n  <h3 class="text-lg font-bold mb-2">6. Election Day Transportation</h3>\n  <p class="mb-4">Arrange for volunteers to provide transportation to the polls on election day. This will help ensure that everyone who wants to vote is able to, even if they don\'t have access to transportation.</p>\n</div>',
    pathToVictory:
      "<h1>Election Analysis</h1><h2>Candidate Information</h2><ul><li>Candidate Name: Matthew Wardenaar</li><li>Office Running For: City Council in Aliso Viejo</li><li>Political Party: Independent</li><li>Election Date: 2024-11-05</li><li>Total Registered Voters: 75000</li><li>Average % Turnout: 37</li><li>Projected Turnout: 40000</li><li>Win Number: 20400</li></ul><h2>Votes Needed by Political Affiliation</h2><ul><li>Democrats: 13200</li><li>Republicans: 4000</li><li>Independents: 3200</li></ul><h2>Tactics for Turning Out Votes</h2><h3>Democrats:</h3><ul><li>1. Increase outreach efforts in heavily Democratic areas.</li><li>2. Collaborate with local Democratic organizations to organize voter registration drives.</li><li>3. Host town hall meetings and public forums focused on issues important to Democrats.</li><li>4. Utilize social media platforms to engage and mobilize Democratic voters.</li></ul><h3>Republicans:</h3><ul><li>1. Conduct door-to-door campaigns in Republican-leaning neighborhoods.</li><li>2. Coordinate with local Republican officials to host meet-and-greets and rallies.</li><li>3. Emphasize conservative values and policies in campaign messaging.</li><li>4. Encourage Republican voter turnout through targeted phone banking efforts.</li></ul><h3>Independents:</h3><ul><li>1. Highlight Matthew Wardenaar's independence and non-partisan approach to governance.</li><li>2. Attend community events and engage with Independent voters directly.</li><li>3. Showcase policy positions that appeal to Independent voters.</li><li>4. Establish partnerships with local business owners and civic leaders to gain support from Independent-leaning voters.</li></ul>",
    why: '<div class="text-lg font-medium">\nI\'m Matthew Wardenaar, an Independent candidate running for city council in Aliso Viejo. With my professional background in product management and passion for community service, I believe I can make a meaningful impact on the future of our city. As a city council member, I would focus on promoting sustainable economic growth, supporting local businesses, and enhancing the quality of life for all residents. I am an advocate for fair competition, integrity in public office, and thoughtful tax policies that benefit our community. I am excited about the opportunity to serve the people of Aliso Viejo and contribute to the betterment of our city.</div>',
    aboutMe:
      '<div class="bg-white p-4 rounded-lg shadow-md">\n<p>Hi, I\'m Matthew Wardenaar, a Product Manager and Independent candidate running for City Council in Aliso Viejo. When I\'m not managing products, I enjoy learning and performing magic tricks, which is always a hit at gatherings and events. With over a decade of experience in project management and leadership roles at companies like Apple, Turo, Dollar Shave Club, and Myspace, I have honed my skills in communication, problem-solving, and strategic planning. As a resident of Aliso Viejo, I am committed to giving back to the community and believe that my background can be beneficial in addressing the challenges our city faces. With a focus on sustainable economic growth, infrastructure improvement, and quality of life for residents, I am excited about the opportunity to contribute to the betterment of our city and serve its people. Additionally, I support policies and initiatives that promote fairness, social programs, and overall economic growth. Thank you for your consideration.</p>\n</div>',
    messageBox:
      '<div class="grid grid-cols-2 grid-rows-2 gap-4">\n  <div class="bg-gray-300 border-2 border-gray-400 p-4">\n    <h2 class="font-bold text-lg">What I Will Say About Myself</h2>\n    <p>I am passionate about serving the community of Aliso Viejo and have the necessary skills and experiences to do so effectively. I believe in policies that support sustainable growth and enhance the quality of life for all residents.</p>\n  </div>\n  <div class="bg-gray-300 border-2 border-gray-400 p-4">\n    <h2 class="font-bold text-lg">What I Will Say About My Opponent</h2>\n    <p>Tiffany Ackley has a strong background in law and has represented small cities and water districts in her career. She has also served on various committees and organizations within Aliso Viejo. However, I believe that my experience in business strategy and project management can also be valuable in addressing the issues facing our city.</p>\n  </div>\n  <div class="bg-gray-300 border-2 border-gray-400 p-4">\n    <h2 class="font-bold text-lg">What My Opponent Will Say About Me</h2>\n    <p>My opponent may criticize my lack of experience in political office and my party affiliation as an Independent. However, I believe that my professional background and dedication to serving the community make me a strong candidate for Aliso Viejo City Council.</p>\n  </div>\n  <div class="bg-gray-300 border-2 border-gray-400 p-4">\n    <h2 class="font-bold text-lg">What My Opponent Will Say About Themselves</h2>\n    <p>Tiffany Ackley will likely highlight her experience in law and her previous service to Aliso Viejo, including her stint as Mayor in 2021. She may also emphasize her commitments to representing different organizations and committees for the city.</p>\n  </div>\n</div>',
  },
  pathToVictory: {
    totalRegisteredVoters: '75000',
    projectedTurnout: '40000',
    winNumber: 20400,
    voterContactGoal: '20398',
    republicans: '25000',
    democrats: '25000',
    indies: '25000',
    averageTurnout: 0,
    allAvailVoters: 0,
    availVotersTo35: 0,
    women: 0,
    men: 0,
    africanAmerican: 0,
    white: 0,
    asian: 0,
    hispanic: 0,
    voteGoal: '22000',
    voterProjection: '0',
    budgetLow: '100000',
    budgetHigh: '150000',
    voterMap: '',
    finalVotes: 0,
    ageMin: 0,
    ageMax: 0,
  },
  incentive: { completed: true },
  color: '#4847a0',
  image:
    'https://assets.goodparty.org/candidate-info/fb52347b-4eb0-4c18-b8e2-6bfde0062629.png',
  hubspotId: '15637660804',
  team: { completed: true },
  social: { completed: true },
  finance: { management: true, regulatory: true, filing: true, ein: true },
  currentStep: 'launch-20',
  profile: { completed: true },
  launch: {
    'website-0': true,
    'website-1': true,
    'media-0': true,
    'media-1': true,
    'media-2': true,
    'media-3': true,
    'media-4': true,
    'socialMedia-0': true,
    'socialMedia-1': true,
    'email-0': true,
    'email-1': true,
    'launchEvent-0': true,
    'launchEvent-1': true,
    'launchEvent-2': true,
    'launchEvent-3': true,
    'launchEvent-4': true,
    'launchEvent-5': true,
    'launchEvent-6': true,
    'launchEvent-7': true,
    'launchEvent-8': true,
  },
  launchStatus: 'launched',
  candidateSlug: 'matthew-wardenaar',
  hashtag: 'MWardenaar2023',
  website: '',
  twitter: 'http://www.twitter.com/omfg',
  instagram: '',
  facebook: '',
  linkedin: '',
  tiktok: '',
  snap: '',
  twitch: '',
  aiContent: {
    socialMediaCopy: { name: 'Social Media Copy', updatedAt: '2023-08-28' },
    fundrasingEmail: {
      name: 'Fundrasing Email',
      content:
        '<div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">\n  <p class="text-center font-bold text-2xl mb-4">Help us reach our fundraising goal!</p>\n  <p class="text-center mb-4">Dear [supporter name],</p>\n  <p class="mb-4">We are just one week away from our fundraising deadline, and I\'m reaching out to our most valued supporters, like you, to ask for your help in achieving our goal.</p>\n  <p class="mb-4">With your past support, we have been able to make great strides in our campaign. But now is not the time to slow down. We need your help to reach our goal of $20,000 by the deadline.</p>\n  <p class="mb-4">Whether you\'re a first-time donor or a repeating one, every contribution counts. And, if you\'re able to help us recruit new donors in your network, that would be a huge help.</p>\n  <p class="mb-4">Together, we can make a meaningful impact on our community and bring real change to Aliso Viejo. Let\'s work towards creating a city that we can all be proud of.</p>\n  <p class="text-center font-bold text-lg mb-4">Will you contribute to our campaign today?</p>\n  <div class="flex justify-center">\n    <a href="#" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-auto">Donate Now</a>\n  </div>\n  <p class="mt-4 text-center">Thank you for your continued support and commitment to our community.</p>\n  <p class="text-center">Sincerely,</p>\n  <p class="text-center">Matthew Wardenaar, Candidate for City Council in Aliso Viejo</p>\n</div>',
      updatedAt: 1692205551857,
    },
    meetGreetEventAssets: {
      name: 'Meet Greet Event Assets',
      content:
        '<div class="text-gray-800">\n\n<!--Event Invitation-->\n<h2 class="text-3xl font-bold mb-4">Meet and Greet with Matthew Wardenaar</h2>\n<p class="text-lg mb-4">Join us on [[Event Date]] at [[Event Location]] for an evening with City Council candidate, Matthew Wardenaar. Meet the candidate, hear remarks, and enjoy drinks and light snacks with fellow community members. Attendees are encouraged to contribute to the campaign.</p>\n<p class="text-lg mb-4">Contribution Levels:</p>\n<ul class="mb-4">\n  <li class="text-lg mb-2"><strong>Bronze:</strong> $25</li>\n  <li class="text-lg mb-2"><strong>Silver:</strong> $50</li>\n  <li class="text-lg mb-2"><strong>Gold:</strong> $100</li>\n  <li class="text-lg"><strong>Host Committee:</strong> $1000</li>\n</ul>\n<a href="#" class="bg-blue-500 hover:bg-blue-600 py-2 px-4 rounded-lg text-white font-bold inline-block mb-4">RSVP Now</a>\n\n<!--Event Email Blast-->\n<h2 class="text-2xl font-bold mb-2">Join us for a Meet and Greet with Matthew Wardenaar</h2>\n<p class="text-lg mb-4">Dear Aliso Viejo Community,</p>\n<p class="text-lg mb-4">You are invited to a Meet and Greet with City Council candidate, Matthew Wardenaar, on [[Event Date]] at [[Event Location]]. Come meet the candidate, hear his vision for the future of our city, and enjoy drinks and light snacks.</p>\n<p class="text-lg mb-4">This event is free to attend, but we encourage attendees to contribute to the campaign at one of four levels: Bronze ($25), Silver ($50), Gold ($100), or Host Committee ($1000). RSVP at the link below and let us know if you plan to attend.</p>\n<a href="#" class="bg-blue-500 hover:bg-blue-600 py-2 px-4 rounded-lg text-white font-bold inline-block mb-4">RSVP Now</a>\n<p class="text-lg mb-4">Thank you for your support, and we hope to see you there!</p>\n<p class="text-lg mb-4">Sincerely,</p>\n<p class="text-lg"><strong>The Matthew Wardenaar Campaign</strong></p>\n\n<!--Social Media Posts-->\n<p class="text-lg mb-4">Post 1:</p>\n<p class="text-lg mb-4"><strong>Join us for a Meet and Greet with Matthew Wardenaar on [[Event Date]] at [[Event Location]]! RSVP now and come meet the candidate and enjoy drinks and light snacks. #WardenaarForAlisoViejo #Community #Election2022</strong></p>\n\n<p class="text-lg mb-4">Post 2:</p>\n<p class="text-lg mb-4"><strong>Are you passionate about the future of Aliso Viejo? Come hear City Council candidate, Matthew Wardenaar, discuss his vision for our community. RSVP for our Meet and Greet on [[Event Date]] at [[Event Location]]. #WardenaarForAlisoViejo #Community #Election2022</strong></p>\n\n<p class="text-lg mb-4">Post 3:</p>\n<p class="text-lg mb-4"><strong>Don\'t miss your chance to meet City Council candidate, Matthew Wardenaar! Join us on [[Event Date]] at [[Event Location]] for a Meet and Greet with the candidate and learn how you can get involved in the campaign. #WardenaarForAlisoViejo #Community #Election2022</strong></p>\n\n<p class="text-lg mb-4">Post 4:</p>\n<p class="text-lg mb-4"><strong>Are you ready to make a difference in Aliso Viejo? Attend a Meet and Greet with City Council candidate, Matthew Wardenaar, on [[Event Date]] at [[Event Location]]. Enjoy drinks and light snacks, hear remarks from the candidate, and learn how you can contribute to the campaign. #WardenaarForAlisoViejo #Community #Election2022</strong></p>\n\n\n</div>',
      updatedAt: 1692205551857,
    },
    launchEmail: {
      name: 'Launch Email',
      updatedAt: '2023-08-28',
      content:
        '<div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">\n  <div class="md:flex">\n    <div class="md:flex-shrink-0">\n      <img class="h-48 w-full object-cover md:w-48" src="https://via.placeholder.com/100x100" alt="Matthew Wardenaar">\n    </div>\n    <div class="p-8">\n      <div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Dear Supporters,</div>\n      <p class="mt-2 text-gray-500">I wanted to share some exciting news with you today - I am officially launching my campaign for City Council in Aliso Viejo!</p>\n      <p class="mt-2 text-gray-500">As a resident of Aliso Viejo, I care deeply about the future of our city and its residents. My background in business strategy, project management, and marketing will be beneficial in addressing the challenges our city faces. I am passionate about giving back to the community and aim to support policies and initiatives that will foster sustainable economic growth, improve our infrastructure, and enhance the quality of life for all residents.</p>\n      <p class="mt-2 text-gray-500">I believe that my experience in leadership and problem-solving makes me a strong candidate for this position. I am committed to engaging with the community, understanding their concerns, and working collaboratively to find innovative solutions to the issues we face. I am excited about the opportunity to contribute to the betterment of our city and serve the people of Aliso Viejo.</p>\n      <p class="mt-2 text-gray-500">I am looking forward to connecting with you all on this journey. If you have any questions or would like to get involved in my campaign, please don\'t hesitate to reach out.</p>\n      <div class="mt-4">\n        <p class="text-gray-500">Thank you for your support!</p>\n        <p class="text-gray-500">Matthew Wardenaar</p>\n      </div>\n    </div>\n  </div>\n</div>',
    },
    candidateWebsite: {
      name: 'Candidate Website',
      content:
        '<div>\n\n<nav class="bg-gray-800">\n  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\n    <div class="flex items-center justify-between h-16">\n      <div class="flex-shrink-0">\n        <a href="#" class="text-white text-4xl font-bold">Matthew Wardenaar for City Council</a>\n      </div>\n      <div class="hidden md:block">\n        <div class="ml-10 flex items-baseline space-x-4">\n          <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</a>\n          <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">About</a>\n          <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Issues</a>\n          <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Volunteer</a>\n          <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Donate</a>\n          <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Contact</a>\n        </div>\n      </div>\n    </div>\n  </div>\n<<br/><br/>av>\n\n<header class="bg-white py-20">\n  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\n    <h1 class="text-4xl font-bold text-gray-900">Join our movement for a better Aliso Viejo</h1>\n  </div>\n</header>\n\n<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">\n  <section>\n    <h2 class="text-2xl font-bold text-gray-900">About Matthew Wardenaar</h2>\n    <p class="mt-4 text-gray-500">Matthew Wardenaar is a dedicated product manager with a passion for serving the community. His professional experience in leading companies like Apple, Turo, and Dollar Shave Club has equipped him with the skills needed to address the challenges facing Aliso Viejo. As an amateur magician, Matthew knows how to connect with people and bring excitement into social situations.</p>\n  </section>\n\n  <section class="mt-12">\n    <h2 class="text-2xl font-bold text-gray-900">Our Vision for Aliso Viejo</h2>\n    <p class="mt-4 text-gray-500">Matthew Wardenaar is committed to fostering sustainable economic growth, improving infrastructure, and enhancing the quality of life for all residents in Aliso Viejo. His focus is on creating policies and initiatives that promote fairness, support social programs, and contribute to a healthy local economy.</p>\n  </section>\n\n  <section class="mt-12">\n    <h2 class="text-2xl font-bold text-gray-900">Volunteer</h2>\n    <p class="mt-4 text-gray-500">Join our team and make a difference in Aliso Viejo. Sign up below to volunteer for various actions such as:</p>\n    <ul class="list-disc list-inside mt-4 text-gray-500">\n      <li>Canvassing and door-to-door outreach</li>\n      <li>Making phone calls to supporters</li>\n      <li>Assisting with campaign events and fundraisers</li>\n      <li>Conducting research and data analysis</li>\n    </ul>\n    <a href="#" class="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-500 hover:bg-green-600">Sign Up to Volunteer</a>\n  </section>\n\n  <section class="mt-12">\n    <h2 class="text-2xl font-bold text-gray-900">Take Action</h2>\n    <p class="mt-4 text-gray-500">There are many ways you can support Matthew Wardenaar\'s campaign:</p>\n    <ul class="list-disc list-inside mt-4 text-gray-500">\n      <li>Spread the word on social media</li>\n      <li>Host a campaign event</li>\n      <li>Donate to fund our efforts</li>\n    </ul>\n    <a href="#" class="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600">Make a Financial Contribution</a>\n  </section>\n\n  <section class="mt-12">\n    <h2 class="text-2xl font-bold text-gray-900">Stay Informed</h2>\n    <p class="mt-4 text-gray-500">Sign up below to receive email updates on Matthew Wardenaar\'s campaign and stay informed about important developments.</p>\n    <form class="mt-6 sm:flex">\n      <input type="email" required placeholder="Enter your email" class="w-full px-4 py-3 border border-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs">\n      <button type="submit" class="mt-4 sm:mt-0 sm:ml-4 inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600">Sign Up</button>\n    </form>\n  </section>\n</main>\n\n<footer class="bg-gray-800 mt-12">\n  <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">\n    <p class="text-gray-300">© 2022 Matthew Wardenaar for City Council. All rights reserved.</p>\n    <div>\n      <a href="#" class="text-gray-300 hover:text-white">\n        <span class="sr-only">Facebook</span>\n        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">\n          <path\n            d="M13 2H9C7.89543 2 7 2.89543 7 4V8H5C2.23858 8 0 10.2386 0 13V19C0 21.7614 2.23858 24 5 24H11C13.7614 24 16 21.7614 16 19V13.2832H12.4375V10H16V6.89443C16 3.83578 14.0751 2 11 2Z">\n          </path>\n        </svg>\n      </a>\n      <a href="#" class="ml-4 text-gray-300 hover:text-white">\n        <span class="sr-only">Twitter</span>\n        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">\n          <path\n            d="M23 4.99995C22.0424 5.67548 20.9837 6.19273 19.86 6.52995C19.2657 5.84645 18.4521 5.35175 17.567 5.13213C16.6819 4.9125 15.7523 4.97475 14.8993 5.31195C14.0464 4.48765 12.9218 3.99995 11.75 3.99995C9.90393 3.99995 8.23857 4.89045 7.107 6.32294C5.97543 7.75542 5.49997 9.57171 5.74997 11.36V12C3.50997 11.95 1.52997 11.0799 0 9.71994C0.84 9.95051 1.73333 10.1162 2.66667 10.207V10.36C2.66667 12.14 3.41997 13.86 4.74997 15.07C3.61503 15.2348 2.51253 14.9356 1.63546 14.2495C0.758395 13.5634 0.176165 12.5357 0.0138529 11.4293C-0.148459 10.3229 0.0336674 9.18584 0.473261 8.1599C0.912856 7.13396 1.59135 6.25268 2.43701 5.61842C3.28266 4.98415 4.26077 4.62165 5.25 4.56994C4.7872 5.2575 4.57504 6.08247 4.64004 6.92361C4.70505 7.76475 5.03949 8.54177 5.593 9.13494C7.132 8.97195 8.608 8.34295 9.847 7.30894C11.086 6.27495 11.998 4.88295 12 3.35994C13.1281 4.36865 14.5527 4.89535 16 4.99995C15.9977 4.99915 15.9954 4.99834 15.9931 4.99754C17.4678 4.85537 18.9018 5.43769 19.9157 6.57094C20.9295 7.70419 21.4653 9.25979 21.44 10.86V11.16C22.3957 10.3142 23.0703 9.21928 23 8.03994C23.6077 7.51401 24 6.77714 24 5.99994C23.998 5.99995 23.996 5.99995 23.994 5.99995C23.9933 5.99812 23.9926 5.99629 23.9919 5.99445C24.6494 5.02138 24.8058 3.84855 24.4099 2.72159C24.014 1.59462 23.1163 0.754272 21.9931 0.403446C20.8698 0.0526202 19.6113 0.235228 18.6399 0.898189C17.6685 1.56115 17.0948 2.61843 17.101 3.71994V4.09994C15.683 4.22194 14.313 4.032',
      updatedAt: 1692205551857,
    },
    launchSocialMediaCopy: {
      name: 'Launch Social Media Copy',
      content:
        '<div class="bg-white p-8">\n \n<h2 class="text-3xl font-bold mb-4">Announcing my Candidacy for Aliso Viejo City Council</h2>\n \n<p class="text-xl mb-4">I\'m excited to officially launch my campaign for City Council in Aliso Viejo. Here\'s a little bit about me:</p>\n \n<!-- Post 1 -->\n<div class="mb-4">\n\t<!-- Facebook -->\n\t<div class="hidden sm:block">\n\t\t<img class="mb-2" src="facebook_icon.png" alt="Facebook Icon">\n\t\t<p>My name is Matthew Wardenaar, and I am a Product Manager and resident of Aliso Viejo. I am running for City Council to bring my skills and experience in business strategy, project management, and marketing to serve the community that I care deeply about.</p>\n\t</div>\n \n\t<!-- Twitter -->\n\t<div class="sm:hidden">\n\t\t<img class="mb-2" src="twitter_icon.png" alt="Twitter Icon">\n\t\t<p>My name is Matthew Wardenaar, and I am a Product Manager and resident of Aliso Viejo. Excited to run for City Council and serve the community with my expertise in business strategy, project management, and marketing.</p>\n\t</div>\n</div>\n \n<!-- Post 2 -->\n<div class="mb-4">\n\t<!-- Facebook -->\n\t<div class="hidden sm:block">\n\t\t<img class="mb-2" src="facebook_icon.png" alt="Facebook Icon">\n\t\t<p>I am passionate about supporting policies and initiatives that will foster sustainable economic growth, improve our infrastructure, and enhance the quality of life for all residents.</p>\n\t</div>\n \n\t<!-- Twitter -->\n\t<div class="sm:hidden">\n\t\t<img class="mb-2" src="twitter_icon.png" alt="Twitter Icon">\n\t\t<p>My goal is to support policies that foster sustainable economic growth, improve infrastructure, and enhance the quality of life for Aliso Viejo residents.</p>\n\t</div>\n</div>\n \n<!-- Post 3 -->\n<div class="mb-4">\n\t<!-- Facebook -->\n\t<div class="hidden sm:block">\n\t\t<img class="mb-2" src="facebook_icon.png" alt="Facebook Icon">\n\t\t<p>The core issues that I am passionate about include addressing income inequality through a balanced wealth tax, supporting fair competition and local businesses, and promoting integrity and transparency by banning Congressional stock trading.</p>\n\t</div>\n \n\t<!-- Twitter -->\n\t<div class="sm:hidden">\n\t\t<img class="mb-2" src="twitter_icon.png" alt="Twitter Icon">\n\t\t<p>My core issues include addressing income inequality with a balanced wealth tax, supporting local businesses and fair competition, and banning Congressional stock trading to promote integrity and transparency.</p>\n\t</div>\n</div>\n \n<!-- Post 4 -->\n<div class="mb-4">\n\t<!-- Facebook -->\n\t<div class="hidden sm:block">\n\t\t<img class="mb-2" src="facebook_icon.png" alt="Facebook Icon">\n\t\t<p>This election is critical for the future of Aliso Viejo. We deserve leaders who will put the interests of our community first and work collaboratively to find innovative solutions to the challenges we face.</p>\n\t</div>\n \n\t<!-- Twitter -->\n\t<div class="sm:hidden">\n\t\t<img class="mb-2" src="twitter_icon.png" alt="Twitter Icon">\n\t\t<p>This election is critical for Aliso Viejo\'s future. We need leaders who will put community interests first and work together to find innovative solutions to our challenges.</p>\n\t</div>\n</div>\n \n<!-- Post 5 -->\n<div>\n\t<!-- Facebook -->\n\t<div class="hidden sm:block">\n\t\t<img class="mb-2" src="facebook_icon.png" alt="Facebook Icon">\n\t\t<p>I am committed to engaging with the community and understanding your concerns as we work toward creating a brighter future for Aliso Viejo. Join me in this journey by sharing this post and spreading the word about my campaign!</p>\n\t</div>\n \n\t<!-- Twitter -->\n\t<div class="sm:hidden">\n\t\t<img class="mb-2" src="twitter_icon.png" alt="Twitter Icon">\n\t\t<p>Let\'s work together to create a brighter future for Aliso Viejo. Join me in this journey by sharing this post and spreading the word about my campaign!</p>\n\t</div>\n</div>\n \n</div>',
      updatedAt: 1692205551857,
    },
    launchSpeech: {
      name: 'Launch Speech',
      content:
        '<div class="container mx-auto my-4">\n\n<h1 class="font-bold text-3xl mb-2">Matthew Wardenaar for Aliso Viejo City Council</h1>\n<h2 class="font-bold text-xl text-gray-600 mb-8">Launch Event Speech</h2>\n\n<p class="my-4">Good evening, Aliso Viejo! My name is Matthew Wardenaar, and I am running for City Council as an Independent candidate. I am so grateful to have all of you here tonight to support my campaign and help me get started on this exciting journey.</p>\n\n<p class="my-4">As a Product Manager and resident of Aliso Viejo, I care deeply about our city and its future. That\'s why I\'m running for City Council – to use my skills and experiences to make a meaningful impact on our community. Over the years, I have honed my leadership, communication, and problem-solving skills through my work at leading companies like Apple, Dollar Shave Club, and Myspace. I have successfully managed numerous projects and teams, leading to the creation and launch of over 40 mobile apps and 22 mobile sites.</p>\n\n<p class="my-4">But my experience isn\'t just limited to the business world. I am passionate about public service, and I believe that my background in business strategy, project management, and marketing can be beneficial in addressing the challenges our city faces. I am committed to engaging with the community, understanding their concerns, and working collaboratively to find innovative solutions to the issues we face.</p>\n\n<p class="my-4">Now, contrast that with my opponent, Tiffany Ackley. While she has some experience in public service, her expertise lies in representing small cities and water districts throughout California. She is a Republican, and while party affiliation shouldn\'t be the sole factor in a race like this, it\'s important to note that I am running as an Independent. I believe in bringing people together, regardless of party lines, to find solutions that benefit everyone in our community.</p>\n\n<p class="my-4">So, what are the key issues in this race? There are a few that I think are especially important:</p>\n\n<ul class="list-disc list-inside my-4">\n    <li>Sustainable economic growth</li>\n    <li>Infrastructure improvements</li>\n    <li>Enhancing the quality of life for all residents</li>\n    <li>Promoting fairness and transparency in government</li>\n</ul>\n\n<p class="my-4">These are issues that I am passionate about, and that I believe I can make progress on as a member of the City Council. But the choice is ultimately yours, Aliso Viejo voters. Do you want a candidate who will bring a fresh perspective and innovative solutions to our challenges? Or do you want to stick with the status quo?</p>\n\n<p class="my-4">The stakes of this election are high. We need leaders who are committed to working hard on behalf of all residents, not just a select few. We need leaders who understand the importance of transparency and accountability in government. And we need leaders who are dedicated to making Aliso Viejo an even better place to call home.</p>\n\n<p class="my-4">So, tonight, I\'m asking for your support. Join me in this journey to make a positive impact on our city. Together, we can achieve great things. Thank you.</p>\n\n</div>',
      updatedAt: 1692205551857,
    },
    launchVideoScript: {
      name: 'Launch Video Script',
      content:
        '<div class="text-lg font-medium leading-normal text-gray-900">\n    <p>Meet Matthew Wardenaar.</p>\n    <p>Product manager. Amateur magician. Independent candidate for Aliso Viejo City Council.</p>\n    <p>Matthew is running for office because he cares about the future of our community. As a resident of Aliso Viejo, he knows how important it is to have local leaders who are committed to making a positive impact on the lives of our residents.</p>\n    <p>Matthew has the professional skills and expertise to tackle the challenges our city is facing. He has worked at leading companies like Apple, Turo, Dollar Shave Club, and Myspace, where he honed his skills in leadership, communication, and problem-solving. He has successfully managed numerous projects and teams, leading to the creation and launch of over 40 mobile apps and 22 mobile sites.</p>\n    <p>Matthew believes that we need to foster sustainable economic growth, improve our infrastructure, and enhance the quality of life for all residents. He is committed to engaging with the community, understanding their concerns, and working collaboratively to find innovative solutions to the issues we face.</p>\n    <p>The stakes of this election are high. We need leaders who will prioritize the needs of our community over their own personal gain. We need leaders who will work tirelessly to build a better future for our families and our neighbors.</p>\n    <p>Join Matthew Wardenaar in the fight for a better Aliso Viejo. Let\'s work together to build a brighter future for our city.</p>\n</div>',
      updatedAt: 1692205551857,
    },
    notificationEmailUpdate: {
      name: 'Notification Email Update',
      content:
        '<div class="p-4 shadow-lg border rounded-lg text-gray-800">\n\n<h1 class="text-2xl font-bold mb-4">Campaign Update from Matthew Wardenaar</h1>\n\n<p>Dear [First Name],</p>\n\n<p>I wanted to reach out and give you a quick update on my campaign for City Council in Aliso Viejo. As we approach the election, I am more committed than ever to helping our community thrive!</p>\n\n<p>Here are a few highlights from the campaign so far:</p>\n\n<ul class="list-disc pl-6 mb-4">\n  <li>We have reached over 1,000 voters through our canvassing and phone banking efforts.</li>\n  <li>I recently participated in a candidate forum where I was able to discuss my vision for Aliso Viejo with a wider audience.</li>\n  <li>We have received endorsements from several local community leaders and organizations.</li>\n</ul>\n\n<p>We still have a lot of work to do, but I am encouraged by the positive feedback I have received from people like you who care about the future of Aliso Viejo. If you haven\'t already, I encourage you to learn more about my platform by visiting my website.</p>\n\n<p>As always, I welcome your feedback and questions. Feel free to reply to this email or reach out to me on social media.</p>\n\n<p>Thank you for your support!</p>\n\n<p>Sincerely,</p>\n<p>Matthew Wardenaar</p>\n\n</div>',
      updatedAt: 1692205551857,
    },
    fundrasingEmail2: {
      name: 'Fundrasing Email2',
      content:
        '<div class="max-w-lg mx-auto py-8 px-4 sm:px-6 lg:px-8">\n  <p class="text-sm font-bold text-gray-500 uppercase tracking-wide">Dear Supporters,</p>\n  <p class="mt-4 text-gray-700 text-xl font-semibold">With just one week left until our fundraising deadline, I am reaching out to ask for your support.</p>\n  <p class="mt-4 text-gray-700 text-xl font-semibold">As many of you know, I am running for City Council in Aliso Viejo to make a meaningful impact on our community and its residents. My passion for public service, combined with my professional expertise and leadership skills, make me a strong candidate for this important role.</p>\n  <p class="mt-4 text-gray-700 text-xl font-semibold">To achieve our goals, we need your help. So far, we have raised $15,000 towards our $20,000 goal. I am so grateful to those of you who have already donated and supported us in this campaign. Your generosity and belief in our vision means so much to me.</p>\n  <p class="mt-4 text-gray-700 text-xl font-semibold">Now, we need to rally together to hit our fundraising goal. Whether this is your first time donating or you have already contributed, any amount helps. Additionally, I encourage you to reach out to your network and help us recruit new donors to the cause.</p>\n  <p class="mt-4 text-gray-700 text-xl font-semibold">As a Product Manager, I have successful experience managing numerous projects that lead to the creation and launch of over 40 mobile apps and 22 mobile sites. I aim to use my skills and innovation to foster sustainable economic growth, improve our infrastructure, and enhance the quality of life for all residents in Aliso Viejo.</p>\n  <p class="mt-4 text-gray-700 text-xl font-semibold">Please consider making a contribution today. Your support is crucial to our success and the future of our city. </p>\n  <p class="mt-4 text-gray-700 text-xl font-semibold">Thank you for your commitment, your belief in our vision, and your help in making positive change happen in Aliso Viejo.</p>\n\n  <div class="mt-8">\n    <a href="#" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-full">\n      Donate Now\n    </a>\n  </div>\n</div>',
      updatedAt: 1692205551857,
    },
    religousAssemblyIntroduction: {
      name: 'Religous Assembly Introduction',
      updatedAt: '2023-08-28',
      content:
        '<div class="max-w-md mx-auto p-4 mt-8">\n  <h1 class="text-3xl font-bold mb-4">Greetings from Matthew Wardenaar!</h1>\n  <p class="mb-4">Dear Members of the Religious Assembly,</p>\n  \n  <p class="mb-4">I hope this message finds you well. As a candidate for the upcoming City Council elections in Aliso Viejo, I am reaching out to introduce myself and seek your valuable advice and insight.</p>\n  \n  <p class="mb-4">My name is Matthew Wardenaar, and I am running as a member of the Independent party. I have been a resident of Aliso Viejo for many years and have a strong passion for public service and community development.</p>\n  \n  <p class="mb-4">Throughout my career as a Product Manager in various prominent companies, I have honed my leadership, communication, and problem-solving skills. This experience has equipped me to tackle the challenges our city faces and contribute to its growth and well-being.</p>\n  \n  <p class="mb-4">My platform is centered around fostering sustainable economic growth, improving infrastructure, and enhancing the overall quality of life for all residents. I believe in supporting policies and initiatives that promote fairness, social programs, and a healthy economy.</p>\n  \n  <p class="mb-4">I am particularly interested in your insights regarding the needs of the community. As a religious assembly deeply connected to the local residents, I value your perspective on the key issues that affect our neighborhoods and the individuals who reside here.</p>\n  \n  <p class="mb-4">Whether it is through addressing income inequality with strategic implementation of a wealth tax, encouraging fair competition and supporting local businesses by breaking up monopolies, or advocating for a Congressional Stock Ban to maintain integrity within our government, I am committed to listening and representing the interests of our community.</p>\n  \n  <p class="mb-4">I kindly request your advice and insight on the unique challenges we face and the solutions that you believe would lead to a stronger, more vibrant Aliso Viejo. Your input will be invaluable in shaping my approach and ensuring that I can effectively serve our community.</p>\n  \n  <p class="mb-4">Thank you in advance for your time, wisdom, and guidance. Together, we can create a brighter future for Aliso Viejo.</p>\n  \n  <p class="mb-4">Warm regards,</p>\n  \n  <p class="font-bold">Matthew Wardenaar</p>\n</div>',
    },
    religousAssemblyIntroduction2: {
      name: 'Religous Assembly Introduction2',
      content:
        '<div class="text-center p-8">\n    <h1 class="text-4xl font-bold mb-4">Introducing Matthew Wardenaar for City Council</h1>\n    <p class="mb-6">Dear Members of the Religious Assembly,</p>\n    \n    <p class="mb-4">I hope this message finds you in good health and high spirits. I am reaching out to introduce myself as a candidate for the upcoming City Council election in Aliso Viejo. As a fellow resident and member of the community, I value the diversity and inclusiveness that religious gatherings and organizations bring to our city.</p>\n    \n    <p class="mb-6">My name is Matthew Wardenaar, and I am running for City Council as a member of the Independent party. With a background in product management and a passion for public service, I am committed to making a meaningful impact on our community. I believe in fostering sustainable economic growth, improving infrastructure, and enhancing the quality of life for all residents. I am excited about the opportunity to serve the people of Aliso Viejo and contribute to the betterment of our city.</p>\n    \n    <p class="mb-4">I am reaching out to your assembly in particular because I value the insights and perspectives of our religious community. I want to ensure that my platform aligns with the needs and aspirations of our community members. I would be grateful for any advice or insight you can offer on the challenges and opportunities our community faces. I believe that by working together and engaging in open dialogue, we can find innovative solutions to address these issues.</p>\n    \n    <p class="mb-6">I would love the opportunity to introduce myself to the assembly and further discuss my platform. If possible, I kindly request a time when I could attend one of your gatherings or events to meet with the members and learn more about the needs of our community. I am eager to hear your thoughts and I am open to any suggestions for ways in which I can support and collaborate with the religious assembly.</p>\n    \n    <p class="mb-4">Thank you for considering my request, and I hope to have the privilege of meeting you soon.</p>\n    \n    <p class="mb-4">Warm regards,</p>\n    \n    <p>Matthew Wardenaar</p>\n</div>',
      updatedAt: 1692205551857,
    },
    doorKnockingScript: {
      name: 'Door Knocking Script',
      updatedAt: '2023-08-18',
    },
    socialMediaCopy2: {
      name: 'Social Media Copy2',
      updatedAt: 1693584292411,
      content:
        '<div class="bg-white p-4">\n  <h2 class="text-xl font-bold mb-4">Upcoming Election for Aliso Viejo City Council</h2>\n  \n  <div class="mb-4">\n    <h3 class="text-lg font-semibold mb-2">Instagram</h3>\n    <div class="border border-gray-200 rounded-lg overflow-hidden bg-gray-100">\n      <video class="w-full h-auto" controls>\n        <source src="instagram_story.mp4" type="video/mp4">\n        Your browser does not support the video tag.\n      </video>\n    </div>\n    <p class="text-center text-sm mt-2">Swipe up to learn more about Matthew Wardenaar and why Aliso Viejo needs an independent city council member like him! 🗳️✨</p>\n  </div>\n  \n  <div class="mb-4">\n    <h3 class="text-lg font-semibold mb-2">Instagram Post</h3>\n    <img class="w-full h-auto mb-2" src="instagram_post.jpg" alt="Matthew Wardenaar for Aliso Viejo City Council">\n    <p class="text-sm">🔥 Exciting news! Aliso Viejo needs independent voices in the City Council. 🗳️💪 Swipe right to learn how Matthew Wardenaar, a product manager and amateur magician, plans to make a difference! Let\'s make Aliso Viejo the best it can be. ✨ #VoteMatthewWardenaar #IndependentForAlisoViejo #MakingADifference</p>\n  </div>\n  \n  <div class="mb-4">\n    <h3 class="text-lg font-semibold mb-2">Facebook Post</h3>\n    <p class="text-sm">🗳️ Attention Aliso Viejo residents! 🗳️</p>\n    <p class="text-sm">Are you looking for an independent candidate who will bring fresh ideas to the City Council? Look no further!</p>\n    <p class="text-sm">Meet Matthew Wardenaar, a seasoned product manager with a passion for magic tricks. His dedication to community service, combined with his professional expertise, makes him the perfect candidate to represent Aliso Viejo. 🌟</p>\n    <p class="text-sm">Visit Matthew Wardenaar\'s campaign website to learn more about his vision for a thriving, inclusive Aliso Viejo. Together, we can make a difference! 🙌</p>\n    <p class="text-sm">#VoteMatthewWardenaar #IndependentForAlisoViejo #MakeADifference</p>\n  </div>\n  \n  <div>\n    <h3 class="text-lg font-semibold mb-2">Twitter Post</h3>\n    <p class="text-sm">🔥 Calling all independent voters in Aliso Viejo! 🔥</p>\n    <p class="text-sm">Join the campaign of Matthew Wardenaar, the independent candidate running for City Council. Together, we can bring positive change and make Aliso Viejo even better. 🌟 Let your voice be heard! 📣</p>\n    <p class="text-sm">#VoteMatthewWardenaar #IndependentForAlisoViejo #PositiveChange</p>\n  </div>\n  \n  <div class="mt-4">\n    <h4 class="text-sm font-semibold">Engage with us:</h4>\n    <ul class="list-disc pl-4 mt-2">\n      <li class="text-sm">What qualities do you look for in a city council member? 🤔</li>\n      <li class="text-sm">What initiatives would you like to see implemented to enhance the quality of life in Aliso Viejo? 🏞️</li>\n      <li class="text-sm">How can an independent candidate like Matthew Wardenaar make a difference in our community? 🌟</li>\n    </ul>\n  </div>\n</div>',
    },
    socialMediaCopy3: {
      name: 'Social Media Copy3',
      updatedAt: 1693584315696,
      content:
        '<div class="container mx-auto">\n  <div class="bg-white rounded-lg shadow-lg p-8 mb-8">\n    <h2 class="text-3xl font-bold mb-4">Upcoming Election: Help Get an Independent Elected!</h2>\n    <h3 class="text-xl font-semibold mb-6">Attention, Eligible Voters!</h3>\n    <p class="text-lg mb-6">Did you know that the upcoming City Council election in Aliso Viejo presents a unique opportunity for independent candidates, like our own Matthew Wardenaar, to make a difference? We need your support to help get an independent elected and bring fresh perspectives and innovative ideas to our community.</p>\n    <h4 class="text-lg font-semibold mb-4">Why Should You Vote Independent?</h4>\n    <ul class="list-disc pl-8 mb-6">\n      <li>Independents prioritize fairness, social programs, and a healthy economy.</li>\n      <li>Matthew Wardenaar\'s experience as a product manager equips him with valuable leadership and problem-solving skills.</li>\n      <li>He has a strong passion for public service and a genuine interest in improving Aliso Viejo.</li>\n      <li>By voting for an independent, you can break the cycle of partisan politics and support a candidate who listens to the needs of residents.</li>\n    </ul>\n    <h4 class="text-lg font-semibold mb-4">Make Your Voice Heard!</h4>\n    <p class="text-lg mb-6">Now is the time to get involved! Join us in electing an independent candidate who will advocate for sustainable economic growth, improved infrastructure, and an enhanced quality of life for all Aliso Viejo residents.</p>\n    <p class="text-lg mb-6">Spread the word and share this post to help us reach more voters who can make a difference. Together, we can make a positive impact on our community!</p>\n    <p class="text-lg mb-4">#VoteIndependent #AlisoViejoElection #MakeADifference</p>\n    <div class="flex justify-between">\n      <a href="#" class="text-lg text-blue-500 hover:underline">Learn More</a>\n      <a href="#" class="text-lg text-blue-500 hover:underline">Support Matthew Wardenaar</a>\n    </div>\n  </div>\n</div>\n\nProbing Questions:\n- Are you registered to vote in the upcoming City Council election in Aliso Viejo?\n- What qualities do you look for in a candidate when deciding who to vote for?\n- How do you think an independent candidate can bring positive change to our community?\n- What issues are most important to you in this election?\n- Do you believe that independent candidates offer a fresh perspective and innovative ideas? Why or why not?',
    },
    socialMediaCopy4: {
      name: 'Social Media Copy4',
      updatedAt: 1693586519381,
      content:
        '<div>\n\n<h2 class="text-4xl font-bold mb-6">Upcoming Election for City Council in Aliso Viejo - Help Get an Independent Elected!</h2>\n\n<div class="grid grid-cols-1 md:grid-cols-2 gap-8">\n\n    <div>\n        <h3 class="text-2xl font-bold mb-4">Instagram Story</h3>\n        <p class="mb-2">📣 Breaking News! 📣</p>\n        <p class="mb-2">The upcoming City Council election in Aliso Viejo is just around the corner. 🗳️ We need your support to shake things up! Help us elect an independent candidate who will put the people first! ✅💪</p>\n        <p class="mb-2">✅ Foster sustainable economic growth</p>\n        <p class="mb-2">✅ Improve infrastructure</p>\n        <p class="mb-2">✅ Enhance the quality of life for all residents</p>\n        <p class="mb-2">Your vote counts! Let\'s make a positive change together! 🌟</p>\n        <p class="mb-2">Swipe up to find out more and join the movement!</p>\n    </div>\n\n    <div>\n        <h3 class="text-2xl font-bold mb-4">Instagram Post</h3>\n        <img src="election-image.jpg" alt="City Council Election" class="mb-4">\n        <p class="mb-2">📣 Breaking News! 📣</p>\n        <p class="mb-2">The upcoming City Council election in Aliso Viejo is just around the corner. 🗳️ We need your support to shake things up! Help us elect an independent candidate who will put the people first! ✅💪</p>\n        <p class="mb-2">✅ Foster sustainable economic growth</p>\n        <p class="mb-2">✅ Improve infrastructure</p>\n        <p class="mb-2">✅ Enhance the quality of life for all residents</p>\n        <p class="mb-2">Your vote counts! Let\'s make a positive change together! 🌟</p>\n        <p class="mb-2">Click the link in our bio to find out more and join the movement!</p>\n    </div>\n\n    <div>\n        <h3 class="text-2xl font-bold mb-4">Facebook Post</h3>\n        <p class="mb-2">📣 Attention all eligible voters! 🗳️</p>\n        <p class="mb-2">Are you tired of the same old politics in Aliso Viejo? It\'s time for a change! Let\'s elect an independent candidate who will prioritize your needs and serve the community with integrity. ✅💪</p>\n        <p class="mb-2">✅ Foster sustainable economic growth</p>\n        <p class="mb-2">✅ Improve infrastructure</p>\n        <p class="mb-2">✅ Enhance the quality of life for all residents</p>\n        <p class="mb-2">Your vote has the power to make a difference! Join us and be a part of the movement for positive change! 🌟</p>\n        <p class="mb-2">Visit our website to learn more and get involved: www.electmatthewwardenaar.com</p>\n    </div>\n\n    <div>\n        <h3 class="text-2xl font-bold mb-4">Twitter Post</h3>\n        <p class="mb-2">📣 Calling all eligible and independent voters in Aliso Viejo! 🗳️</p>\n        <p class="mb-2">Ready for real change? Elect an independent candidate who will fight for you and put the people first. ✅💪 Together, we can build a brighter future for our community!</p>\n        <p class="mb-2">✅ Foster sustainable economic growth</p>\n        <p class="mb-2">✅ Improve infrastructure</p>\n        <p class="mb-2">✅ Enhance the quality of life for all residents</p>\n        <p class="mb-2">Your vote matters! Join the movement for progress and make your voice heard! 🌟 #AlisoViejoElection</p>\n    </div>\n</div>\n\n<h3 class="text-2xl font-bold mt-8">Let\'s start a conversation:</h3>\n<p class="mt-2">What issues do you believe are most important for our City Council to address? 🏢🌱</p>\n\n</div>',
    },
  },
  reportedVoterGoals: { doorKnocking: 2080, calls: 1787, digital: 2312 },
  lastVisited: 1694039856150,
};

const cand = {
  campaignOnboardingSlug: 'matthew-wardenaar',
  firstName: 'Matthew',
  lastName: 'Wardenaar',
  party: 'Independent',
  state: 'CA',
  office: 'Other',
  slogan: 'Making Magic Happen for Aliso Viejo',
  about:
    "Hi, I'm Matthew Wardenaar, a Product Manager and Independent candidate running for City Council in Aliso Viejo. When I'm not managing products, I enjoy learning and performing magic tricks, which is always a hit at gatherings and events. With over a decade of experience in project management and leadership roles at companies like Apple, Turo, Dollar Shave Club, and Myspace, I have honed my skills in communication, problem-solving, and strategic planning. As a resident of Aliso Viejo, I am committed to giving back to the community and believe that my background can be beneficial in addressing the challenges our city faces. With a focus on sustainable economic growth, infrastructure improvement, and quality of life for residents, I am excited about the opportunity to contribute to the betterment of our city and serve its people. Additionally, I support policies and initiatives that promote fairness, social programs, and overall economic growth. Thank you for your consideration.",
  why: "I'm Matthew Wardenaar, an Independent candidate running for City Council in Aliso Viejo. With my professional experience in product management and my passion for public service, I believe I can make a meaningful impact on our community. As a resident of Aliso Viejo, I care deeply about the future of our city and its residents. My focus will be on supporting policies that promote sustainable economic growth, improve our infrastructure, and enhance the quality of life for all residents. I believe in a balanced and thoughtful approach to issues like income inequality and monopolies, while prioritizing the well-being of our community. Finally, I believe in holding our public officials to the highest standards of transparency and integrity, which is why I support a Congressional Stock Ban. As a member of the City Council, I will work to ensure that Aliso Viejo continues to thrive and be a great place to call home.",
  pastExperience:
    'Throughout my career, I have been fortunate to work in various industries and roles, ranging from mobile app development to product management at leading companies like Apple, Turo, Dollar Shave Club, and Myspace. These experiences have equipped me with valuable skills in leadership, communication, and problem-solving. I have successfully managed numerous projects and teams, leading to the creation and launch of over 40 mobile apps and 22 mobile sites.\n\nIn addition to my professional achievements, I am passionate about giving back to the community. As a resident of Aliso Viejo, I care deeply about the future of our city and its residents. I have always been interested in public service, and I believe that my background in business strategy, project management, and marketing can be beneficial in addressing the challenges our city faces.\n\nI want to run for city council in Aliso Viejo to leverage my skills and experiences to make a meaningful impact on the community. I aim to support policies and initiatives that will foster sustainable economic growth, improve our infrastructure, and enhance the quality of life for all residents. Moreover, I am committed to engaging with the community, understanding their concerns, and working collaboratively to find innovative solutions to the issues we face.\n\nIn summary, my passion for public service, coupled with my professional expertise and leadership skills, make me a strong candidate for the Aliso Viejo City Council. I am excited about the opportunity to contribute to the betterment of our city and serve the people of Aliso Viejo.',
  occupation: 'Product Manager',
  funFact:
    "I have a penchant for learning and performing magic tricks. Over the years, I have honed my skills as an amateur magician, and I often enjoy entertaining friends, family, and colleagues at gatherings and events. It's a great way for me to break the ice, connect with people, and bring a little extra fun and excitement into social situations.",
  voteGoal: 22000,
  voterProjection: 0,
  color: '#574AF0',
  image: 'https://assets.goodparty.org/candidate-info/4rnvajahmp8.png',
  isActive: true,
  slug: 'matthew-wardenaar',
  id: 125,
  endorsements: [
    {
      name: 'Tomer Almog',
      image:
        'https://assets.goodparty.org/candidate-info/a332fe7f-1bb6-4fd0-8b03-5e230c05ae72.jpg',
      content: 'I endorse this guy.',
    },
    {
      name: 'Workers Unioin',
      image:
        'https://assets.goodparty.org/candidate-info/b2940f3f-270b-46b5-b6dc-eeec0ca6b10f.webp',
      content: 'We crush it',
    },
  ],
  district: 'Aliso Viejo',
  otherOffice: 'Tree Commissioner',
  website: 'www.matthewwardenaar.com',
  finalVotes: false,
};
