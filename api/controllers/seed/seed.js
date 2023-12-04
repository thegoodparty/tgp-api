module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      let activated = 0;
      // const campaigns = await Campaign.find({ isActive: false });
      const campaigns = await Campaign.find().populate(user);
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i].data;
        const user = campaign[i].user;
        if (!campaign) {
          continue;
        }
        if (
          campaign.campaignPlan?.slogan &&
          !campaign.pathToVictory &&
          (!campaign.p2vStatus || campaign.p2vStatus !== 'Waiting')
        ) {
          await sendSlackMessage(campaign, user);
          if (campaign.p2vStatus !== 'Waiting') {
            await Campaign.updateOne({ id: campaigns[i].id }).set({
              data: {
                ...campaign,
                p2vStatus: 'Waiting',
              },
            });
          }
        }
      }

      return exits.success({
        message: `Activated ${activated} campaigns`,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

async function sendSlackMessage(campaign, user) {
  if (appBase !== 'https://goodparty.org') {
    return;
  }
  const { slug, details } = campaign;
  const { firstName, lastName, office, state, city, district } = details;
  const slackMessage = {
    text: `Onboarding Alert!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `__________________________________ \n *Candidate completed details section * \n ${appBase}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*We need to add their admin Path to victory*\n
          \nName: ${firstName} ${lastName}
          \nOffice: ${office}
          \nState: ${state}
          \nCity: ${city || 'n/a'}
          \nDistrict: ${district || 'n/a'}
          \nemail: ${user.email}
          \nslug: ${slug}\n
          \nadmin link: ${appBase}/admin/victory-path/${slug}
          \n
          \n<@U01AY0VQFPE> and <@U03RY5HHYQ5>
          `,
        },
      },
    ],
  };

  await sails.helpers.slack.slackHelper(slackMessage, 'victory');
}

const c = {
  slug: 'tomer-almog',
  details: {
    firstName: 'Tomer',
    lastName: 'Almog',
    zip: '04654',
    dob: '1978-04-24',
    citizen: 'yes',
    party: 'Forward Party',
    otherParty: '',
    knowRun: 'yes',
    state: 'CA',
    office: 'US Senate',
    district: '',
    articles: '',
    runBefore: 'no',
    officeRunBefore: '',
    pastExperience:
      'I have 5 years of experience on the local school board, where I worked to improve the quality of education by developing policies, securing funding, and establishing partnerships. This led to higher student achievement, increased graduation rates, and better school facilities. This experience has equipped me with the skills and commitment needed to serve as an elected official.',
    occupation: 'CTO of Good Party',
    funFact:
      "I love playing the guitar and writing songs in my free time. I've even performed at a few local open mic nights! Music has been a passion of mine for as long as I can remember, and I believe that it has helped me to develop creativity, perseverance, and a willingness to take risks. Whether writing a song or crafting a policy proposal, I bring the same enthusiasm and dedication to everything I do.",
    topIssues: {
      positions: [
        {
          createdAt: 1649095557495,
          updatedAt: 1649095557495,
          id: 133,
          name: 'Fund Public Schools',
          topIssue: {
            createdAt: 1649095557491,
            updatedAt: 1649095557491,
            id: 29,
            name: 'Education',
          },
        },
        {
          createdAt: 1649095557510,
          updatedAt: 1649095557510,
          id: 137,
          name: 'Stop Book Bans',
          topIssue: {
            createdAt: 1649095557491,
            updatedAt: 1649095557491,
            id: 29,
            name: 'Education',
          },
        },
      ],
      'position-133': 'Public school needs more funding.',
      'position-12': 'Too many taxes!',
      'position-137': 'This is the first sign of Tyrany and fear',
    },
    pledged: true,
    campaignPhone: '3109759102',
    campaignCommittee: '',
    city: '',
    officeTermLength: '2 years',
  },
  goals: {
    filedStatement: 'yes',
    campaignCommittee: 'committee of JavaScript',
    electionDate: '2024-03-03',
    runningAgainst: [
      {
        name: 'John Smith',
        description: 'John Smith is a corrupt politician ',
        party: 'Democrat Party',
      },
    ],
    campaignWebsite: 'https://tomeralmog.com',
  },
  campaignPlanStatus: {
    timeline: { status: 'completed', createdAt: 2678400000 },
    policyPlatform: { status: 'completed', createdAt: 2678400000 },
    communicationsStrategy: { status: 'completed', createdAt: 2678400000 },
    slogan: { status: 'completed', createdAt: 2678400000 },
    pathToVictory: { status: 'completed', createdAt: 2678400000 },
    getOutTheVote: { status: 'completed', createdAt: 2678400000 },
    operationalPlan: { status: 'completed', createdAt: 2678400000 },
    mobilizing: { status: 'completed', createdAt: 2678400000 },
    aboutMe: { status: 'completed', createdAt: 2678400000 },
    why: { status: 'completed', createdAt: 1698714536977 },
    messageBox: { status: 'completed', createdAt: 2678400000 },
    socialMediaCopy: { status: 'completed', createdAt: 2678400000 },
    candidateWebsite: { status: 'completed', createdAt: 2678400000 },
    socialMediaCopy2: { status: 'completed', createdAt: 2678400000 },
    launchEmail: { status: 'completed', createdAt: 2678400000 },
    launchVideoScript: { status: 'completed', createdAt: 2678400000 },
    fundrasingEmail: { status: 'completed', createdAt: 2678400000 },
    pressRelease: { status: 'completed', createdAt: 2678400000 },
    communityEventInvitation: { status: 'completed', createdAt: 1698713474553 },
    pressRelease2: { status: 'completed', createdAt: 1698714147225 },
    pressRelease3: { status: 'completed', createdAt: 1698723387736 },
  },
  campaignPlan: {
    communicationsStrategy:
      '<div class="bg-blue-600 text-white py-4 px-8 rounded-lg">\n  <h1 class="text-3xl font-bold mb-2">Tomer Almog for US Senate</h1>\n  <p class="text-sm font-bold">Independent Candidate</p>\n</div>\n\n<div class="my-8">\n  <h2 class="text-2xl font-bold mb-4">About Tomer Almog</h2>\n  <p class="text-lg mb-4 leading-relaxed">Tomer Almog is a successful CTO of Good Party and a passionate musician who has performed at several local open mic nights. Throughout his five years of experience on the local school board, he has worked towards improving the quality of education through developing policies, securing funding, and establishing partnerships. Tomer\'s commitment and skills in this area make him the right candidate to fight for our children\'s education.</p>\n  <p class="text-lg leading-relaxed">Tomer Almog brings enthusiasm and dedication to everything he does, whether it\'s writing a song or crafting policy proposals. He believes that his passion for music has helped him develop creativity, perseverance, and a willingness to take risks.</p>\n</div>\n\n<div class="my-8">\n  <h2 class="text-2xl font-bold mb-4">Why Tomer Almog is Running?</h2>\n  <p class="text-lg leading-relaxed">Tomer Almog cares deeply about public schools and education. As an experienced school board member, he has seen the difference that good policies, adequate funding, and community involvement can make. Tomer is running for US Senate to continue his work towards education policies that benefit children and families across the state.</p>\n</div>\n\n<div class="my-8">\n  <h2 class="text-2xl font-bold mb-4">The Race</h2>\n  <p class="text-lg leading-relaxed">Tomer Almog is running as an independent candidate in the US Senate election against John Smith, who represents the corrupt Democrat Party. With his proven track record of being an honest and dedicated public servant, Tomer Almog is the clear choice in this election.</p>\n  <p class="text-lg leading-relaxed">Make sure to vote for Tomer Almog on November 23, 2023, and together we can keep dishonest politicians out of office and make a positive impact on public education. </p>\n</div>',
    slogan: '"Tomer Almog: Not in a Party, But Always Ready to Rock!"',
    pathToVictory:
      '<div>\n  <h2 class="font-bold text-lg mb-2">Field Plan for Tomer Almog\'s US Senate Campaign</h2>\n  <h3 class="font-bold text-md mb-2">Targeting Independent Voters</h3>\n  <p class="mb-2">Our first priority is to target the 100 registered Independent voters. Our field plan will focus on:</p>\n  <ul class="list-disc ml-6 mb-2">\n    <li>Setting up a phone banking system to reach out to Independent voters and encourage them to vote for Tomer Almog.</li>\n    <li>Having volunteers go door-to-door in key Independent precincts to inform them of Tomer Almog\'s platform and encourage them to vote.</li>\n  </ul>\n  \n  <h3 class="font-bold text-md mb-2">Building Support Among Republican Voters</h3>\n  <p class="mb-2">While the area has more registered Republicans than Democrats and Independents combined, we believe we can secure a portion of this vote by focusing on:</p>\n  <ul class="list-disc ml-6 mb-2">\n    <li>Setting up a booth at the local farmer\'s market to connect with Republican voters and share Tomer Almog\'s values and policies. </li>\n    <li>Hosting small meet-and-greet events with Republican voters in the community to build personal relationships with voters and address their concerns.</li>\n    <li>Placing ads in local radio stations and community newspapers targeted towards Republican voters to raise awareness of Tomer Almog\'s platform.</li>\n  </ul>\n\n  <h3 class="font-bold text-md mb-2">Winning Over Democratic Voters</h3>\n  <p class="mb-2">Although there are fewer registered Democratic voters in the area, we still believe it is important to reach out to this voter base through:</p>\n  <ul class="list-disc ml-6 mb-2">\n    <li>Participating in local town hall meetings and other events to introduce Tomer Almog\'s platform and engage with Democratic voters in the community.</li>\n    <li>Partnering with local Democratic organizations and leaders to build alliances and increase visibility among the party.</li>\n    <li>Running ads and placing campaign materials in traditionally Democratic areas to ensure that they are aware of Tomer Almog\'s candidacy and his vision for the Senate.</li>\n  </ul>\n  \n  <h3 class="font-bold text-md mb-2">Overall Turnout Plan</h3>\n  <p class="mb-2">To achieve the win number of 25.5, we need to have at least 50 registered voters turn out to vote in the election. Our strategy for increasing turnout is:</p>\n  <ul class="list-disc ml-6 mb-2">\n    <li>Engage with voters via social media and targeted email campaigns to remind them of the election date and Tomer Almog\'s candidacy.</li>\n    <li>Have volunteers put up yard signs and door hangers throughout the area to increase visibility and remind voters to vote on election day.</li>\n    <li>Set up a volunteer-led transportation program to help voters who need assistance getting to the polling location.</li>\n  </ul>\n\n</div>',
    policyPlatform:
      '<div class="bg-gray-200 p-4 rounded-lg">\n  <h2 class="text-2xl font-bold mb-4">Tomer Almog\'s Policy Platform</h2>\n  <h3 class="text-lg font-semibold mb-2">1. Fund Public Schools (Education)</h3>\n  <ul class="list-disc ml-6 mb-4">\n    <li>Invest in teacher training and development programs to ensure quality education.</li>\n    <li>Secure funding for school infrastructure and technology upgrades.</li>\n    <li>Create partnerships with local businesses and organizations to provide resources and opportunities for students.</li>\n  </ul>\n  <h3 class="text-lg font-semibold mb-2">2. Stop Book Bans (Education)</h3>\n  <ul class="list-disc ml-6 mb-4">\n    <li>Oppose any legislation or policies that seek to ban or censor books in school libraries.</li>\n    <li>Champion the importance of diverse and inclusive literature in education.</li>\n    <li>Work with educators and school boards to provide resources for teachers to incorporate diverse literature into their curriculum.</li>\n  </ul>\n  <h3 class="text-lg font-semibold mb-2">3. Defend 2nd Amendment (Guns)</h3>\n  <ul class="list-disc ml-6 mb-4">\n    <li>Protect the rights of law-abiding citizens to own firearms for self-defense and recreation.</li>\n    <li>Oppose any legislation or policies that seek to limit or penalize legal gun ownership.</li>\n    <li>Promote responsible gun ownership through education and training programs.</li>\n  </ul>\n</div>',
    getOutTheVote:
      '<div class="flex flex-col items-center justify-center mx-auto my-8">\n  <h2 class="text-2xl font-bold mb-4">Get out the Vote for Tomer Almog!</h2>\n  <img src="https://via.placeholder.com/200" alt="Tomer Almog for Senate" class="rounded-full mb-4">\n  <p class="text-center mb-4">Tomer Almog is an experienced CTO of Good Party and a passionate advocate for education. Let\'s help him win the US Senate race against corrupt politician John Smith!</p>\n  <h3 class="text-lg font-bold mb-2">Tactics:</h3>\n  <ol class="list-decimal px-4">\n    <li class="my-2">Host "Jam for Tomer" events where Tomer can showcase his musical talents and discuss his policies with voters</li>\n    <li class="my-2">Partner with local schools and parent-teacher associations to promote Tomer\'s commitment to fund public schools</li>\n    <li class="my-2">Organize phone banks to encourage supporters to get out and vote on Election Day</li>\n    <li class="my-2">Distribute flyers with information on Tomer\'s policies and voting information</li>\n    <li class="my-2">Collaborate with local businesses to display posters and host meet-and-greet events with Tomer</li>\n  </ol>\n  <p class="text-center font-bold mt-4">Let\'s make a difference and elect Tomer Almog to the US Senate!</p>\n</div>',
    timeline:
      'Here\'s a corrected response with the requested information:\n\n<div class="bg-white p-4 rounded-lg shadow-md">\n    <h1 class="text-2xl font-bold mb-4">Tomer Almog\'s US Senate Campaign Plan Timeline</h1>\n    <p class="mb-4">Election Day: November 23, 2023</p>\n\n    <h2 class="text-xl font-bold mb-2">Week of Election Day</h2>\n    <ul class="list-disc ml-8 mb-4">\n        <li>Mobilize volunteers and supporters for Election Day activities such as poll monitoring and maximizing turnout efforts.</li>\n        <li>Conduct final campaign events while adhering to election laws and regulations.</li>\n        <li>Finalize get-out-the-vote efforts that leverage digital and field operations to drive planned turnout (e.g. ride to polls programs, push notifications).</li>\n    </ul>\n\n    <h2 class="text-xl font-bold mb-2">Two Weeks Prior to Election Day</h2>\n    <ul class="list-disc ml-8 mb-4">\n        <li>Continue to leverage digital, field, and traditional media to reach out to voters, focusing on demographic groups where turnout is historically underwhelming.</li>\n        <li>Host final rallies in key media markets and bring out significant local supporters, labor groups or party officials.</li>\n        <li>Continue voter registration efforts in states that allow same day voter registration.</li>\n    </ul>\n\n    <h2 class="text-xl font-bold mb-2">Four Weeks Prior to Election Day</h2>\n    <ul class="list-disc ml-8 mb-4">\n        <li>Launch the final phase of TV and digital advertising campaigns while developing earned and social media initiatives.</li>\n        <li>Process absentee or early voting ballots by encouraging supporters to return their ballots as soon as they arrive using email, texts, and phone calls.</li>\n        <li>Continue voter registration efforts and register underrepresented groups that support the candidate.</li>\n    </ul>\n\n    <h2 class="text-xl font-bold mb-2">Six Weeks Prior to Election Day</h2>\n    <ul class="list-disc ml-8 mb-4">\n        <li>Release the candidate\'s economic policies and highlight Tomer Almog\'s CTO experience and the impact of STEM in his vision for American workers.</li>\n        <li>Debate preparation and playbook refinement.</li>\n        <li>Earned media opportunities targeting early voting states and voter registration deadlines.</li>\n    </ul>\n\n    <h2 class="text-xl font-bold mb-2">Eight Weeks Prior to Election Day</h2>\n    <ul class="list-disc ml-8 mb-4">\n        <li>Announce specific education policy proposals to improve public schools in the United States.</li>\n        <li>Debate preparation and opposition research.</li>\n        <li>Develop earn media content highlighting Tomer Almog\'s passion for music and the arts and the impact it has had on his life and community.</li>\n    </ul>\n\n    <h2 class="text-xl font-bold mb-2">Ten Weeks Prior to Election Day</h2>\n    <ul class="list-disc ml-8 mb-4">\n        <li>Launch the first wave of TV, digital, and mailer ads targeting key constituencies.</li>\n        <li>Develop field operations in competitive states or counties, and hire necessary field staff.</li>\n        <li>Work with political party factions and interest groups that align with independent views to distribute targeted ads and messaging to those audiences.</li>\n    </ul>\n\n    <h2 class="text-xl font-bold mb-2">Twelve Weeks Prior to Election Day</h2>\n    <ul class="list-disc ml-8 mb-4">\n        <li>Begin door-to-door canvassing and phone banking to identify and persuade voters to support Tomer Almog\'s campaign, leveraging strong messaging utilizing independent values and policies.</li>\n        <li>Develop an independent campaign platform using values like transparency, accountability, and respect for all members of the community regardless of political affiliation.</li>\n        <li>Conduct interviews with local media outlets to introduce Tomer Almog and establish credibility to voters.</li>\n    </ul>\n</div>',
    mobilizing:
      'Here\'s a political field plan based on the information you provided for Tomer Almog:\n\n<h1 class="text-3xl font-bold mb-4">Tomer Almog\'s Political Field Plan</h1>\n\n<h2 class="text-xl font-bold mb-2">1. Voter Targeting</h2>\n\n<p class="mb-4">Based on Tomer Almog\'s campaign platform as an independent candidate who cares about quality education, leading with integrity, and creating positive change, here are our suggestions on voter targeting:</p>\n\n<ul class="list-disc list-inside mb-6">\n  <li><strong>Base Voters:</strong> We suggest targeting independent voters who are looking for an alternative to traditional party politics. Given Tomer\'s background in education, we also suggest focusing on parents and educators.</li>\n  <li><strong>Sway Voters:</strong> We suggest focusing outreach on Democrats who are disillusioned with their party, particularly those in the 20-70 age range and women. For Republicans, we suggest targeting those who prioritize education and second amendment rights.</li>\n  <li><strong>Avoid:</strong> Based on our analysis, we recommend avoiding Democratic voters who are highly loyal to their party and less likely to consider an independent candidate.</li>\n  <li><strong>Demographic Focus:</strong> Our outreach efforts will focus on people in the 20-70 age range, with a slightly higher emphasis on women than men. We will also focus on party affiliation, with a stronger emphasis on Independents and Republicans.</li>\n</ul>\n\n<h2 class="text-xl font-bold mb-2">2. Canvassing Strategy</h2>\n\n<p class="mb-4">Based on our analysis, here is our proposed canvassing strategy:</p>\n\n<ul class="list-disc list-inside mb-6">\n  <li><strong>Timeline:</strong> We recommend starting canvassing efforts at least 6 months before the election date and ramping up as we approach election day. This gives our volunteers enough time to reach out to voters and build up name recognition for Tomer.</li>\n  <li><strong>Weekly Goals:</strong> We recommend knocking on 1000 doors per week to maximize our reach and connect with potential voters.</li>\n  <li><strong>Volunteer Recruitment:</strong> We recommend recruiting and training volunteers from local communities who have a vested interest in supporting our campaign. We will also work with local advocacy groups and organizations to identify potential volunteers.</li>\n  <li><strong>Materials:</strong> We will provide volunteers with scripts, literature and other campaign materials to help them engage with voters in a meaningful way.</li>\n</ul>\n\n<h2 class="text-xl font-bold mb-2">3. Phone Banking</h2>\n\n<p class="mb-4">Based on our analysis, here is our proposed phone banking strategy:</p>\n\n<ul class="list-disc list-inside mb-6">\n  <li><strong>Timeline:</strong> We recommend starting phone banking efforts 6 months before the election and increasing outreach as we get closer to the election date.</li>\n  <li><strong>Weekly Goals:</strong> We recommend making at least 4800 calls per week to reach our target audience.</li>\n  <li><strong>Volunteer Recruitment:</strong> We will recruit and train volunteers to make calls and provide them with scripts and other support materials.</li>\n  <li><strong>Contact Rate:</strong> We estimate that each volunteer can make at least 48 contacts per hour. Keeping our assumptions in line with this should secure success for these efforts.</li>\n</ul>\n\n<h2 class="text-xl font-bold mb-2">4. Voter Registration</h2>\n\n<p class="mb-4">Based on our analysis, here is how we plan to tackle voter registration:</p>\n\n<ul class="list-disc list-inside mb-6">\n  <li><strong>Timeline:</strong> We will prioritize voter registration efforts at the beginning and middle of our campaign time frame. We will also make a final push closer to the registration deadline.</li>\n  <li><strong>Outreach:</strong> We will work with local organizations to identify potential voters who are not yet registered and provide them with information about the registration process. We will also use our canvassing and phone banking efforts to encourage voter registration among our target audience.</li>\n</ul>\n\n<h2 class="text-xl font-bold mb-2">5. Get-Out-The-Vote (GOTV)</h2>\n\n<p class="mb-4">Based on our analysis, here is our proposed GOTV strategy:</p>\n\n<ul class="list-disc list-inside mb-6">\n  <li><strong>Timeline:</strong> We will focus on GOTV efforts in the final weeks leading up to the election, with particular emphasis on the weekend before the election.</li>\n  <li><strong>Outreach:</strong> We will remind supporters to vote via phone and email, and also provide them with information about polling locations and hours. We will also provide transportation to polling locations for those who need it.</li>\n  <li><strong>Increase in voter turnout:</strong> Based on our analysis and past election results, we estimate that our efforts can feasibly increase supportive voter turnout by 2% to 5%. While this may not seem very high, it can make a big difference in a close race.</li>\n</ul>\n\n<h2 class="text-xl font-bold mb-2">6. Data Management</h2>\n\n<p class="mb-4">Managing data is crucial for any political campaign. Here\'s how we plan to manage our data:</p>\n\n<ul class="list-disc list-inside mb-6">\n  <li><strong>Data tracking:</strong> We will track data related to voter contact information, canvassing results, phone banking results and other relevant metrics to help us target our outreach efforts more effectively.</li>\n  <li><strong>Data reporting:</strong> We will regularly report on our data to identify trends and course-correct where necessary.</li>\n</ul>\n\n<h2 class="text-xl font-bold mb-2">Conclusion</h2>\n\n<p class="mb-4">We believe that our comprehensive field plan, which includes voter targeting, canvassing, phone banking, voter registration and GOTV efforts, will increase our chances of victory in the upcoming US Senate election. By using data-driven tactics and working closely with our volunteers and supporters, we are confident that we can create a positive change for the future.</p>\n\n<a href="#" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">\n  Join Team Almog!\n</a>',
    operationalPlan:
      '<h1 class="text-3xl font-bold">Operational Plan for Tomer Almog for US Senate</h1>\n\n<h2 class="text-xl font-bold mt-8">Goals</h2>\n<ul class="list-disc list-inside">\n    <li>Win the US Senate race against John Smith</li>\n    <li>Focus on Fund Public Schools (Education)</li>\n    <li>Establish strong partnerships to achieve educational reform</li>\n</ul>\n\n<h2 class="text-xl font-bold mt-8">Budget</h2>\n<p>The budget for Tomer Almog\'s US Senate race will be approximately $2 million. This budget will be used for the following expenses:</p>\n<ul class="list-disc list-inside">\n    <li>Salaries for campaign staff (<strong>$500,000</strong>)</li>\n    <li>Advertising and marketing (<strong>$750,000</strong>)</li>\n    <li>Travel expenses (<strong>$100,000</strong>)</li>\n    <li>Event planning and execution (<strong>$300,000</strong>)</li>\n    <li>Office expenses and rent (<strong>$250,000</strong>)</li>\n</ul>\n\n<h2 class="text-xl font-bold mt-8">Staffing Structure</h2>\n<p>Tomer Almog\'s campaign will require a dedicated team of staff members. The following positions will be needed:</p>\n<ul class="list-disc list-inside">\n    <li>Campaign Manager</li>\n    <li>Communications Director</li>\n    <li>Fundraising Director</li>\n    <li>Field Director</li>\n    <li>Volunteer Coordinator</li>\n    <li>Finance Director</li>\n    <li>Policy Advisor</li>\n</ul>\n<p>Each staff member will have specific roles and responsibilities, as outlined by Tomer Almog\'s campaign. Salaries and benefits will be competitive and based on experience and skill level.</p>',
    aboutMe:
      '<div class="bg-blue-200 p-5 rounded-lg">\n    <h2 class="text-2xl font-bold mb-5">About Me</h2>\n    <p class="mb-5"><span class="font-bold">My name is Tomer Almog</span>, and I\'m running for US Senate as a member of the Independent/None party. As the CTO of Good Party, I have experience leading teams to accomplish important goals, and I\'m ready to bring that same leadership to the Senate. </p>\n    \n    <p class="mb-5">In my free time, I love playing the guitar and writing songs. Music has been a passion of mine for as long as I can remember, and I believe it has helped me to develop important skills like creativity, perseverance, and willingness to take risks. Whether crafting a song or a policy proposal, I bring the same enthusiasm and dedication to everything I do.</p>\n    \n    <p class="mb-5">I have also served on the local school board for 5 years, where I worked hard to improve the quality of education. I developed policies, secured funding, and established partnerships to increase student achievement, graduation rates, and school facilities. This experience has equipped me with the skills and commitment needed to serve as an elected official in the Senate.</p>\n    \n    <p class="mb-5"><span class="font-bold">My priorities include:</span></p>\n    <ul class="list-disc pl-5 mb-5">\n        <li>Fund Public Schools (Education)</li>\n        <li>Stop Book Bans (Education)</li>\n        <li>Defend 2nd Amendment (Guns)</li>\n    </ul>\n    \n    <p class="mb-5">In the 2023-11-23 election, I am running against John Smith, a corrupt politician from the Democrat Party. I believe that the people of this state deserve better than a corrupt politician, and I am ready to fight for them. So please, vote for me, Tomer Almog, for US Senate on Election Day.</p><p class="mb-5"><br></p><p class="mb-5">sddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsddddddddddddsddsdddddddddddd</p>\n</div>',
    why: "<div class=\"bg-white p-4 rounded-lg shadow-md\">\n# **Why I'm Running**\n\nAs a member of the **Forward Party**, I, **Tomer Almog**, am running for the office of US Senate. With my experience as the CTO of Good Party, I have honed my skills in leadership and innovation. But there's more to me than just tech expertise.\n\n*Fun fact: I love playing the guitar and writing songs in my free time. I've even performed at a few local open mic nights!* Music has shaped my life, teaching me the value of **creativity, perseverance**, and **risk-taking**. These qualities are essential for any elected official.\n\nMoreover, my **5 years of experience on the local school board** have allowed me to make a tangible impact. I developed policies, secured funding, and formed partnerships to **improve the quality of education**. Through these efforts, we achieved higher student achievement, increased graduation rates, and better school facilities.\n\nI am deeply committed to two specific causes: \n\n1. **Fund Public Schools**: Public school education is a cornerstone of our society, and it needs **more funding** to provide all children with equal opportunities.\n2. **Stop Book Bans**: The ban on books is the first sign of **tyranny and fear**, and we must preserve intellectual freedom and the power of knowledge.\n\nIf elected, I will bring my passion, dedication, and expertise to the role, fighting for **quality education** and **the preservation of democratic values**.\n\nVote for progress. Vote for the future. Vote for **Tomer Almog**.\n</div>",
    messageBox:
      '<div class="grid grid-cols-2 gap-4">\n\n  <div class="bg-green-300 p-4">\n    <h1 class="font-bold text-lg mb-4">What I will say about myself</h1>\n    <ul>\n      <li>I\'m Tomer Almog, an independent candidate running for the US Senate.</li>\n      <li>I have years of experience on the local school board, where I worked to improve the quality of education.</li>\n      <li>I\'m a CTO of Good Party and my passion is music, which has helped me develop creativity, perseverance, and a willingness to take risks.</li>\n      <li>I care deeply about funding public schools, stopping book bans, and defending the 2nd amendment.</li>\n    </ul>\n  </div>\n\n  <div class="bg-red-300 p-4">\n    <h1 class="font-bold text-lg mb-4">What I will say about my opponent</h1>\n    <ul>\n      <li>My opponent, John Smith, is a corrupt politician.</li>\n      <li>He\'s from the Democrat Party and is beholden to special interests and big money donors.</li>\n      <li>He\'ll say and do anything to win, regardless of the ethical implications.</li>\n      <li>He has a long history of supporting policies that harm constituents and put profits over people.</li>\n    </ul>\n  </div>\n\n  <div class="bg-blue-300 p-4">\n    <h1 class="font-bold text-lg mb-4">What my opponent will say about me</h1>\n    <ul>\n      <li>Tomer Almog is a fringe candidate with no real place in the political landscape.</li>\n      <li>He\'s too inexperienced and has no real grasp on how to get things done in Congress.</li>\n      <li>His policies are unrealistic and would never be able to pass in a divided government.</li>\n      <li>He\'s too focused on music and other extracurricular activities to take the job of US Senator seriously.</li>\n    </ul>\n  </div>\n\n  <div class="bg-yellow-300 p-4">\n    <h1 class="font-bold text-lg mb-4">What my opponent will say about themselves</h1>\n    <ul>\n      <li>John Smith is the only candidate with the experience and know-how to get things done in Congress.</li>\n      <li>He\'s committed to fighting for the people, not special interests or big money donors.</li>\n      <li>His policies are realistic and will bring about the changes that constituents need most.</li>\n      <li>He has a proven track record of success and has always put the needs of his constituents first.</li>\n    </ul>\n  </div>\n\n</div>',
  },
  pathToVictory: {
    totalRegisteredVoters: '1000',
    projectedTurnout: '50',
    winNumber: 26,
    voterContactGoal: '185000',
    republicans: '500',
    democrats: '400',
    indies: '100',
    averageTurnout: '33',
    allAvailVoters: 0,
    availVotersTo35: 0,
    women: '60',
    men: '40',
    africanAmerican: '20',
    white: '30',
    asian: '20',
    hispanic: '30',
    voteGoal: '3000',
    voterProjection: '2800',
    budgetLow: 0,
    budgetHigh: 0,
    voterMap:
      'https://www.google.com/maps/d/embed?mid=1tY1TYLxD87Pnw900nZVTyX2YxGKH7f4&ehbc=2E312F',
    ageMin: '20',
    ageMax: '70',
  },
  image:
    'https://assets.goodparty.org/candidate-info/f157e110-2c49-4045-8e80-4e89f65ad97e.jpeg',
  hubspotId: '15631267201',
  team: { completed: true },
  social: { completed: true },
  finance: { ein: true, management: true, regulatory: true, filing: true },
  launch: {
    'website-1': true,
    'media-0': true,
    'media-1': true,
    'media-2': true,
    'media-3': true,
    'media-4': true,
    'socialMedia-0': true,
    'socialMedia-1': true,
    'email-1': true,
    'launchEvent-0': true,
    'launchEvent-1': true,
    'launchEvent-2': true,
    'launchEvent-3': true,
    'launchEvent-4': true,
    'launchEvent-5': true,
    'launchEvent-6': true,
  },
  launched: true,
  profile: { completed: true },
  currentStep: 'launch-16',
  launchStatus: 'launched',
  candidateSlug: 'tomer-almog2',
  color: '#EA932D',
  aiContent: {
    socialMediaCopy: {
      name: 'Social Media Copy',
      updatedAt: '2023-08-29',
      content: '<p>create a social pos</p>',
    },
    candidateWebsite: {
      name: 'Candidate Website',
      updatedAt: '2023-08-28',
      content:
        '<p>Why did the tomato turn red?</p><p>Because it saw the salad dressing! sda adasd as sdsd</p>',
    },
    socialMediaCopy2: {
      name: 'Social Media Copy2',
      content:
        '<div class="p-4">\n  <h2 class="text-3xl font-bold pb-4">Get Tomer Almog Elected as the First Independent Senator!</h2>\n  \n  <div class="grid grid-cols-2 gap-4">\n    <div>\n      <div class="bg-gray-100 rounded-lg p-4">\n        <h3 class="text-xl font-bold pb-2">Instagram Story</h3>\n        <p class="pb-2">Swipe up to learn how you can help get an independent voice in the US Senate!</p>\n        <p class="pb-2">Don\'t let the two-party system control our democracy.</p>\n        <p class="pb-2">Vote for Tomer Almog!</p>\n        <a href="#" class="bg-blue-500 text-white rounded-lg px-4 py-2 inline-block">Learn More</a>\n      </div>\n    </div>\n    <div>\n      <div class="bg-gray-100 rounded-lg p-4">\n        <h3 class="text-xl font-bold pb-2">YouTube Video Script</h3>\n        <p class="pb-2">Are you sick of the same old politicians in the US Senate?</p>\n        <p class="pb-2">Meet Tomer Almog, the independent candidate who will fight for your voice to be heard.</p>\n        <p class="pb-2">Join Tomer\'s movement and help us bring diversity, fresh ideas, and real change to Washington.</p>\n        <a href="#" class="text-blue-500 font-bold hover:underline">Watch Now</a>\n      </div>\n    </div>\n    <div>\n      <div class="bg-gray-100 rounded-lg p-4">\n        <h3 class="text-xl font-bold pb-2">LinkedIn Blog Post</h3>\n        <p class="pb-2">As an independent candidate for US Senate, I am proud to represent the voice of the people, not the special interests.</p>\n        <p class="pb-2">It\'s time for a change in Washington, and I am ready to lead the charge.</p>\n        <p class="pb-2">Join me in this fight to bring real democracy and fairness to the people.</p>\n        <a href="#" class="bg-blue-500 text-white rounded-lg px-4 py-2 inline-block">Read More</a>\n      </div>\n    </div>\n    <div>\n      <div class="bg-gray-100 rounded-lg p-4">\n        <h3 class="text-xl font-bold pb-2">Twitter Thread</h3>\n        <p class="pb-2">The two-party system has failed us for too long.</p>\n        <p class="pb-2">It\'s time for an independent voice in the US Senate.</p>\n        <p class="pb-2">Join the movement and help get Tomer Almog elected!</p>\n        <a href="#" class="text-blue-500 font-bold hover:underline">#VoteTomerAlmog</a>\n      </div>\n    </div>\n    <div>\n      <div class="bg-gray-100 rounded-lg p-4">\n        <h3 class="text-xl font-bold pb-2">Facebook Post</h3>\n        <p class="pb-2">Attention all voters who are tired of the same old politics:</p>\n        <p class="pb-2">Join us and support Tomer Almog, the first independent candidate for US Senate!</p>\n        <p class="pb-2">Let\'s break the two-party system and bring real change to the people.</p>\n        <a href="#" class="text-blue-500 font-bold hover:underline">Learn More</a>\n      </div>\n    </div>\n    <div>\n      <div class="bg-gray-100 rounded-lg p-4">\n        <h3 class="text-xl font-bold pb-2">Reddit Post</h3>\n        <p class="pb-2">Hey, Reddit community! Let\'s be the change we want to see in the world.</p>\n        <p class="pb-2">Join us and support Tomer Almog, the independent candidate for US Senate who truly represents the people.</p>\n        <a href="#" class="text-blue-500 font-bold hover:underline">Vote for Tomer</a>\n      </div>\n    </div>\n    <div>\n      <div class="bg-gray-100 rounded-lg p-4">\n        <h3 class="text-xl font-bold pb-2">Discord Post</h3>\n        <p class="pb-2">Calling all members of the Discord community who value diversity and fresh ideas.</p>\n        <p class="pb-2">Join us and support Tomer Almog, the independent candidate for US Senate who will fight for our voice to be heard.</p>\n        <a href="#" class="text-blue-500 font-bold hover:underline">Join the Movement</a>\n      </div>\n    </div>\n  </div>\n\n  <div class="pt-6">\n    <h4 class="font-bold pb-2">Join the conversation:</h4>\n    <p class="pb-2">What inspired you to consider voting for an independent candidate?</p>\n    <p class="pb-2">What do you think are the most important issues that an independent senator would bring to the table?</p>\n  </div>\n</div>',
      updatedAt: 1692374180664,
    },
    launchEmail: {
      name: 'Launch Email',
      content:
        '<div class="p-10 text-center text-2xl text-purple-600">\nWhy did the tomato turn red?\nBecause it saw the salad dressing!123</div>',
      updatedAt: 1692374180664,
    },
    launchVideoScript: {
      name: 'Launch Video Script',
      content:
        '<div class="p-5 text-center text-xl font-bold text-purple-600">Why don\'t scientists trust atoms?<br>Because they make up everything.</div>',
      updatedAt: 1692374180664,
    },
    fundrasingEmail: {
      name: 'Fundrasing Email',
      updatedAt: 1693276950137,
      content:
        '<div class="max-w-2xl mx-auto p-4">\n  <p class="text-2xl font-bold">Dear Supporter,</p>\n  \n  <p class="mt-4">I hope this email finds you well. As we approach our fundraising deadline just one week from now, I wanted to take a moment to express my deep gratitude for your unwavering support throughout this campaign. Your belief in our vision and your contributions have been instrumental in getting us this far.</p>\n  \n  <p class="mt-4">As an independent candidate running for the US Senate, we face unique challenges in terms of fundraising and gaining traction. We rely solely on the support of grassroots movements, like ours, to make a real difference. That\'s why I\'m reaching out to you today.</p>\n  \n  <p class="mt-4">Our campaign has set an ambitious goal of raising $20,000 by the upcoming deadline. This is crucial to ensure we have the resources needed to reach a wider audience, engage more voters, and ultimately bring about the positive change we all desire.</p>\n  \n  <p class="mt-4">I humbly ask you to consider making a contribution to our campaign. Whether you\'ve supported us before or not, your contribution matters now more than ever. Every dollar brings us closer to our goal and strengthens our movement to create a better future for our country.</p>\n  \n  <p class="mt-4">Additionally, I kindly request that you reach out to your network of friends, family, and colleagues who share our values and ask them to support our cause as well. Encourage them to join us in this fight for a more just and equitable society.</p>\n  \n  <p class="mt-4">Remember, no contribution is too small. Every dollar helps us bring about the change our country desperately needs.</p>\n  \n  <p class="mt-4">You can easily make a contribution on our campaign website. Simply visit [website link] to donate securely and efficiently. If you have any questions or need assistance, please don\'t hesitate to reach out to our team.</p>\n  \n  <p class="mt-4">Once again, thank you for your continued support. Together, we can make a lasting impact and build a brighter future for all.</p>\n  \n  <p class="mt-4 font-bold">Sincerely,</p>\n  <p class="font-bold">Tomer Almog</p>\n</div>',
    },
    pressRelease: {
      name: 'Press Release',
      updatedAt: 1694788261752,
      content:
        '<div class="text-black">\n  <h1 class="text-3xl font-bold">Press Release: Tomer Almog Announces Candidacy for US Senate</h1>\n  <p class="mt-4 mb-2">FOR IMMEDIATE RELEASE</p>\n  <p class="text-gray-500">Date</p>\n</div>\n\n<div class="text-black">\n  <p>City, State - Tomer Almog, the Chief Technology Officer of Good Party and a passionate advocate for education, announces his candidacy for the US Senate as an Independent/None. With a proven track record of service and dedication to his community, Almog seeks to bring fresh ideas and innovative solutions to the political landscape.</p>\n  \n  <h2 class="text-xl font-bold mt-4">A Passion for Service and Education</h2>\n  \n  <p>Inspired by his love for music and its ability to foster creativity and perseverance, Almog brings the same enthusiasm and dedication to his pursuit of public service. As a five-year member of the local school board, he spearheaded efforts to improve the quality of education, resulting in higher student achievement, increased graduation rates, and better school facilities.</p>\n  \n  <p>Regarding his experience, Almog stated, "I have seen firsthand the impact that effective policies, secure funding, and strong partnerships can have on our education system. It is crucial that we invest in our public schools to provide our children with the tools they need to succeed."</p>\n  \n  <h2 class="text-xl font-bold mt-4">Contrast to Corrupt Politics</h2>\n  \n  <p>One of Almog\'s key goals is breaking the cycle of corrupt politics that plagues our nation. He firmly believes that the well-being of the people should be the focus of any elected official, and not self-interest or partisan agendas. Almog\'s opponent, John Smith, has been labeled as a corrupt politician, highlighting the need for a fresh voice and a new approach.</p>\n  \n  <h2 class="text-xl font-bold mt-4">Candidate Quotes</h2>\n  \n  <p>"Through my experience in public service and my dedication to the welfare of our community, I am confident in my ability to bring about positive change," Almog affirmed. "As an Independent, I am free from the constraints of partisan politics, allowing me to always put the interests of the people first."</p>\n  \n  <p>Almog further emphasizes his commitment to addressing crucial issues by stating, "We need to defend our fundamental rights, such as the freedom of speech and the right to bear arms. I firmly believe that an armed citizenry is necessary to safeguard our democracy, and I will fight to protect the Second Amendment."</p>\n  \n  <h2 class="text-xl font-bold mt-4">Voter Choice and Election Stakes</h2>\n  \n  <p>The upcoming election presents voters with a crucial choice. They can choose to continue with the status quo of corrupt politics or select Tomer Almog, a candidate driven by integrity and a genuine desire to serve the public. The stakes are high, and this election will determine the direction our country takes on important issues such as education, individual rights, and the influence of big banks.</p>\n  \n  <p>Voters are encouraged to consider the qualifications, dedication, and fresh perspective that Tomer Almog brings to the table. By voting for Almog, they will be electing a candidate committed to improving education, upholding citizens\' rights, and fighting for a fair and transparent political system.</p>\n  \n  <p>For media inquiries, contact:</p>\n  <p>Publicist: [Publicist Name]</p>\n  <p>Phone: [Publicist Phone Number]</p>\n  <p>Email: [Publicist Email]</p>\n  \n  <p>Website: [Candidate\'s Campaign Website]</p>\n</div>',
    },
    communityEventInvitation: {
      name: 'Community Event Invitation',
      updatedAt: 1698713485251,
      inputValues: {
        'Event Location': 'Simi Valley',
        'Event Promotion': 'Party invitation',
        'Additional instructions': '',
      },
      content:
        '<div>\n\n<p class="text-black">Dear Simi Valley Community Members,</p>\n\n<p class="text-black">I hope this message finds you in good health and high spirits. My name is Tomer Almog, and I am running for the US Senate with the Forward Party. As the Chief Technology Officer of the Good Party, a passionate guitarist, songwriter, and former member of the local school board, I am delighted to invite you to a special community event.</p>\n\n<p class="text-black">Date: [Event Date]</p>\n<p class="text-black">Time: [Event Time]</p>\n<p class="text-black">Location: [Event Location]</p>\n\n<p class="text-black">The aim of this event is to bring our community together, foster meaningful connections, and discuss critical issues that affect us all. Through heartfelt conversations, we can find common ground, create positive change, and build an inclusive future for Simi Valley.</p>\n\n<p class="text-black">During my time on the local school board, I worked tirelessly to improve the quality of education for all students. I firmly believe that education is the cornerstone of progress, and as your US Senator, I will fight to increase funding for public schools to ensure every child receives a high-quality education.</p>\n\n<p class="text-black">In addition to my dedication to education, I am deeply committed to defending our freedom of expression. It is alarming to witness attempts to ban books, as it signifies the erosion of our fundamental rights. I will tirelessly work to preserve our intellectual liberties and confront any form of censorship. Together, we can ensure a society that values diversity of thought and the freedom to explore different perspectives.</p>\n\n<p class="text-black">Your presence at this event is crucial, as it will provide an opportunity for us to discuss your concerns, your aspirations, and your vision for Simi Valley. Together, we can shape a community that thrives, empowers, and flourishes.</p>\n\n<p class="text-black">Please RSVP at [RSVP Email/Phone Number] to confirm your attendance and secure your spot. Space is limited, so please make sure to reserve your place as soon as possible.</p>\n\n<p class="text-black">Thank you for your time and consideration. Let us come together as a community and sow the seeds of a brighter future for Simi Valley.</p>\n\n<p class="text-black">Warm regards,</p>\n\n<p class="text-black">Tomer Almog</p>\n<p class="text-black">Candidate for the US Senate</p>\n\n</div>',
    },
    pressRelease2: {
      name: 'Press Release2',
      updatedAt: 1698714163258,
      inputValues: {
        'Subject of Press Release': 'Announcing my campaign launch',
        'Additional instructions': '',
      },
      content:
        "<div class=\"text-black\">\n<p><strong>FOR IMMEDIATE RELEASE</strong></p>\n<p><strong>Announcing Tomer Almog's Candidacy for US Senate</strong></p>\n<p><strong>A Fresh Voice for Progress: Forward Party's CTO and Education Advocate Enters the Race</strong></p>\n<p>City, State - Date - Tomer Almog, the Chief Technology Officer (CTO) of the Good Party and a passionate advocate for education, officially announces his candidacy for United States Senate. Almog brings a unique perspective to the race, combining his expertise in technology with his dedication to improving education and prioritizing the needs of the community.</p>\n<p><strong>About Tomer Almog:</strong></p>\n<p>Tomer Almog, renowned for his musical talents as a guitarist and songwriter, has performed at local open mic nights. This creative outlet has allowed him to develop key qualities such as perseverance, creativity, and risk-taking. Almog's passion for music translates into his work as a public servant, enabling him to approach policy proposals with the same enthusiasm and dedication.</p>\n<p>With five years of experience serving on the local school board, Almog has been at the forefront of improving the quality of education. Through his dedication, he successfully developed policies, secured essential funding, and fostered partnerships, resulting in higher student achievement, increased graduation rates, and enhanced school facilities. Almog's invaluable experience equips him with the skills necessary to serve as an elected official.</p>\n<p><strong>Reasons for Running:</strong></p>\n<p>Tomer Almog has decided to run for the US Senate due to his unwavering commitment to public service and his deep-rooted belief that education is the cornerstone of a thriving society. Recognizing the urgent need for improved funding in public schools, Almog aims to prioritize and advocate for increased investment in education. He firmly believes that every student deserves access to a high-quality education, regardless of their background or zip code.</p>\n<p><strong>Hypothetical Quote from Tomer Almog:</strong></p>\n<p>\"I am thrilled to announce my candidacy for the US Senate. As an advocate for education, I have witnessed firsthand the transformative power of quality schooling. By leveraging my experiences and skills, I will fight for equitable funding and resources to give every child in our great nation the opportunity to succeed.\"</p>\n<p><strong>Voter Choice:</strong></p>\n<p>Tomer Almog's candidacy offers voters the chance to elect a dedicated public servant who prioritizes education. Almog's holistic approach, blending his technological expertise with his passion for education, sets him apart as a candidate who understands the needs of the 21st-century workforce and the importance of providing every child with a strong educational foundation.</p>\n<p><strong>The Stakes Are High:</strong></p>\n<p>In this election, Tomer Almog's opponent, John Smith, a corrupt politician from the Democrat Party, fails to represent the interests of the people. It is crucial for voters to choose a candidate who is untainted by corruption and genuinely committed to serving the community. The outcome of this election will determine whether public schools receive the funding they desperately require and if book bans, the first sign of tyranny and fear, will be stopped in their tracks.</p>\n<p><strong>Contact:</strong></p>\n<p>For media inquiries or to request an interview with Tomer Almog, please contact:</p>\n<p>Name: [Publicist's Name]</p>\n<p>Phone Number: [Phone Number]</p>\n<p>Email Address: [Email Address]</p>\n</div>",
    },
    pressRelease3: {
      name: 'Press Release3',
      updatedAt: 1698723407951,
      inputValues: {
        'Subject of Press Release': 'Announcing my campaign launch',
        'Additional instructions': '',
      },
      content:
        '<div class="text-black">\n  \n<h1 class="text-4xl font-bold mb-4">Tomer Almog Announces Candidacy for US Senate</h1>\n\n<h2 class="text-2xl font-bold mb-4">Experienced CTO and Education Advocate Joins Forward Party</h2>\n\n<p class="mb-4"><span class="font-bold">CITY, STATE -</span> Today, Tomer Almog, a successful technology executive and passionate advocate for education, officially announced his candidacy for the United States Senate. Almog is running as a member of the Forward Party, a vibrant newcomer in the political landscape.</p>\n\n<p class="mb-4">As the Chief Technology Officer of the Good Party and an accomplished guitarist, Almog brings a unique blend of technological expertise and creative vitality to his campaign. In his free time, he enjoys playing the guitar and composing songs, showcasing his artistic side. This musical passion has shaped his work ethic and contributed to his ability to think innovatively and boldly.</p>\n\n<p class="mb-4">With a strong background in education, Almog served for five years on the local school board, where he actively worked towards improving the quality of education. Through his efforts in policy development, resource acquisition, and establishing valuable partnerships, Almog successfully raised academic standards, increased graduation rates, and enhanced school facilities. This invaluable experience has equipped him with the skills and dedication necessary to effectively serve as an elected official.</p>\n\n<p class="mb-4">When asked about his reason for running, Almog stated, "I am deeply committed to public service, and I believe it is our responsibility to create a better future for generations to come. As an experienced technology leader and education advocate, I aim to bring about positive change in our communities by focusing on the core values of progress, innovation, and equity."</p>\n\n<p class="mb-4">Referring to his vision for education policy, Almog emphasized, "One of my top priorities is to fund public schools adequately. Education is the foundation of a prosperous society, and it is crucial that we invest in our students\' future by providing sufficient resources and support."</p>\n\n<p class="mb-4">In addition, Almog voiced concern about recent book bans, stating, "The recent imposition of book bans is the first sign of tyranny and fear. It is essential that we protect intellectual freedom and promote diversity of thought, as it is through open dialogue and exposure to differing perspectives that we grow as a society."</p>\n\n<p class="mb-4">Almog\'s campaign comes at a critical juncture, as he aims to unseat the incumbent Democrat, John Smith, whom he describes as a "corrupt politician." With his platform grounded in transparency, integrity, and a commitment to the needs and aspirations of the American people, Almog provides voters with a fresh alternative and a genuine opportunity for change.</p>\n\n<p class="mb-4">The upcoming election represents a pivotal moment for the state and the nation. Voters have the power to shape the direction of their communities and the country as a whole. It is crucial that they carefully consider the issues at stake and select a candidate who represents their values and will work tirelessly to advance their interests.</p>\n\n<p class="mb-4">Tomer Almog\'s campaign represents a new era of leadership, innovation, and dedication. With his combination of experience, passion, and broad support, Almog is poised to make a meaningful impact on education policies and numerous other critical issues that affect the lives of everyday Americans.</p>\n\n<p class="mb-4"><span class="font-bold">Contact:</span> For further inquiries, please contact Sarah Johnson at (555) 123-4567 or sarah.johnson@email.com</p>\n\n</div>',
    },
  },
  lastStepDate: '2023-06-27',
  reportedVoterGoals: { doorKnocking: 40600, calls: 12243, digital: 1400 },
  lastVisited: 1701541148524,
  id: 1,
};
