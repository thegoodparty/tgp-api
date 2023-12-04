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
        if (!campaign) {
          continue;
        }
        if (
          campaign.campaignPlan?.slug &&
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
  lastVisited: 1701674710450,
  id: 1,
  details: {
    firstName: 'Tomer',
    lastName: 'Almog',
    campaignPhone: '3109759102',
    zip: '93065',
    dob: '1978-04-24',
    citizen: 'yes',
    filedStatement: 'yes',
    campaignCommittee: 'committee of JavaScript',
    party: 'Independent',
    otherParty: '',
    knowRun: 'no',
    office: 'Other',
    officeTermLength: '2 years',
    district: '',
    city: '',
    articles: '',
    runBefore: 'no',
    officeRunBefore: '',
    pastExperience: 'I like turtles',
    occupation: 'CTO of Good Party',
    funFact: 'I like turtles',
    pledged: true,
    ballotOffice: null,
    state: 'CA',
    otherOffice: 'Ventura County Education Board - Area 3',
    positionId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb24vMTYxMzYw',
    electionId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvRWxlY3Rpb24vNDMxNw==',
  },
  currentStep: 'campaignPlan-7',
  lastStepDate: '2023-11-24',
  customIssues: [
    { title: 'Economic Development', position: 'sdsd', order: 1 },
    { title: 'Education', position: 'adasdas', order: 2 },
    { title: 'adas', position: 'dsds', order: 3 },
  ],
  campaignPlanStatus: {
    policyPlatform: { status: 'failed', createdAt: 1700453604516 },
    slogan: { status: 'completed', createdAt: 1701472886943 },
    aboutMe: { status: 'completed' },
    why: { status: 'completed', createdAt: 1700453739830 },
    mobilizing: { status: 'completed', createdAt: 1700453708709 },
    messageBox: { status: 'completed', createdAt: 1700453713713 },
    pathToVictory: { status: 'completed', createdAt: 1700453714650 },
    communicationsStrategy: { status: 'completed', createdAt: 1700453719623 },
    pressRelease: { status: 'completed', createdAt: 1700454147156 },
    launchSocialMediaCopy: { status: 'completed', createdAt: 1701112612972 },
    pressRelease2: { status: 'completed', createdAt: 1701112711937 },
  },
  campaignPlan: {
    aboutMe:
      'Tomer Almog, a dedicated and experienced professional, is driven by a genuine passion for serving the community and bringing about positive change. As the CTO of Good Party and an independent candidate for Mayor, Tomer Almog has exemplified his commitment to excellence and innovation. With a love for turtles, Tomer Almog brings a unique perspective and a sense of wonder to the political arena. Throughout his past experiences, he has demonstrated unwavering dedication to the causes he cares about, particularly in advocating for the needs of the unknown. Tapping into his wealth of knowledge and expertise, Tomer Almog is ready to lead with transparency, integrity, and a clear vision for a better future.',
    slogan:
      '"Vote Tomer Almog for Education Board: Putting Unknown Students First!"',
    communicationsStrategy:
      '<div class="p-4">\n  <h1 class="mb-4 text-xl font-bold">Communication Plan for Tomer Almog\'s Mayoral Campaign</h1>\n  \n  <!-- Situation Analysis -->\n  <h2 class="mb-2 text-lg font-bold">Situation Analysis</h2>\n  <p class="mb-4">As a candidate running for Mayor, Tomer Almog faces a highly competitive race against Donald Trump from the Republican Party. The current political landscape requires careful analysis to identify key issues and challenges that the campaign needs to address effectively.</p>\n  \n  <!-- Target Audience -->\n  <h2 class="mb-2 text-lg font-bold">Target Audience</h2>\n  <p class="mb-4">The campaign must prioritize understanding the demographics, interests, and concerns of the target audience(s) to tailor messaging and outreach efforts. This includes reaching out to residents of the city, community leaders, and potential supporters alike.</p>\n  \n  <!-- Message Development -->\n  <h2 class="mb-2 text-lg font-bold">Message Development</h2>\n  <p class="mb-4">Crafting a clear, concise, and compelling message is vital for Tomer Almog\'s campaign. The message should resonate with the target audience(s) and address their most pressing issues, reassuring them of his commitment to their concerns.</p>\n  \n  <!-- Media Relations -->\n  <h2 class="mb-2 text-lg font-bold">Media Relations</h2>\n  <p class="mb-4">Building strong relationships with journalists and media outlets will help secure media coverage for the campaign. Press releases, talking points, and other materials should be developed to support outreach efforts and ensure consistent messaging.</p>\n  \n  <!-- Digital Strategy -->\n  <h2 class="mb-2 text-lg font-bold">Digital Strategy</h2>\n  <p class="mb-4">A robust social media strategy should be implemented to engage with supporters, reach new audiences, and mobilize volunteers. Compelling digital content will be created and shared across various online platforms to raise awareness and generate campaign enthusiasm.</p>\n  \n  <!-- Events and Rallies -->\n  <h2 class="mb-2 text-lg font-bold">Events and Rallies</h2>\n  <p class="mb-4">Organizing public events, rallies, and other activities will be crucial to generate enthusiasm for Tomer Almog\'s campaign and encourage support and participation from the public. These events will serve as opportunities to connect with voters on a more personal level.</p>\n  \n  <!-- Fundraising -->\n  <h2 class="mb-2 text-lg font-bold">Fundraising</h2>\n  <p class="mb-4">Developing a comprehensive fundraising strategy is essential for the success of the campaign. Clear fundraising goals should be established, and appropriate materials will be created to solicit donations. Potential donors and fundraising opportunities will be identified to secure necessary funds.</p>\n  \n  <!-- Candidate Information -->\n  <h2 class="mb-2 text-lg font-bold">About the Candidate - Tomer Almog</h2>\n  <ul class="list-disc ml-6 mb-4">\n    <li>Name: Tomer Almog</li>\n    <li>Party: Independent</li>\n    <li>Occupation: CTO of Good Party</li>\n    <li>Fun Fact: I like turtles</li>\n    <li>Past Experience: I like turtles</li>\n    <li>Campaign Focus: Unknown</li>\n  </ul>\n  \n  <!-- Race Information -->\n  <h2 class="mb-2 text-lg font-bold">Race Information</h2>\n  <ul class="list-disc ml-6">\n    <li>Opponent: Donald Trump</li>\n    <li>Party: Republican Party</li>\n    <li>Description: Mr. President</li>\n    <li>Election Date: March 11, 2024</li>\n  </ul>\n</div>',
    pathToVictory:
      '```\n<div class="p-8 bg-gray-100">\n    <h1 class="text-2xl font-bold mb-4">Candidate Information</h1>\n    <ul class="list-disc list-inside mb-6">\n        <li><strong>Candidate Name:</strong> Tomer Almog</li>\n        <li><strong>Office Running For:</strong> Mayor</li>\n        <li><strong>Political Party:</strong> Independent</li>\n        <li><strong>Election Date:</strong> 2024-03-11</li>\n        <li><strong>Total Registered Voters:</strong> [[totalRegisteredVoters]]</li>\n        <li><strong>Average % Turnout:</strong> [[averageTurnout]]</li>\n        <li><strong>Projected Turnout:</strong> [[projectedTurnout]]</li>\n    </ul>\n\n    <h2 class="text-xl font-bold mb-4">Votes Needed from Each Political Affiliation</h2>\n    <p>Based on the win number [[winNumber]], the following number of votes are needed from each political affiliation:</p>\n\n    <ul class="list-disc list-inside mb-6">\n        <li><strong>Democrats:</strong> Calculate based on voter registration</li>\n        <li><strong>Republicans:</strong> Calculate based on voter registration</li>\n        <li><strong>Independents:</strong> Calculate based on voter registration</li>\n    </ul>\n\n    <h2 class="text-xl font-bold mb-4">Tactics for Turning Out Votes</h2>\n\n    <h3 class="text-lg font-bold mb-2">Democrats:</h3>\n    <ul class="list-disc list-inside mb-4">\n        <li>Tactic 1</li>\n        <li>Tactic 2</li>\n        <li>Tactic 3</li>\n    </ul>\n\n    <h3 class="text-lg font-bold mb-2">Republicans:</h3>\n    <ul class="list-disc list-inside mb-4">\n        <li>Tactic 1</li>\n        <li>Tactic 2</li>\n        <li>Tactic 3</li>\n    </ul>\n\n    <h3 class="text-lg font-bold mb-2">Independents:</h3>\n    <ul class="list-disc list-inside">\n        <li>Tactic 1</li>\n        <li>Tactic 2</li>\n        <li>Tactic 3</li>\n    </ul>\n</div>\n```',
    why: '<div class="text-blue-500">\n    <p class="font-bold">\n        Why I\'m Running for Mayor: Tomer Almog\n    </p>\n    <p>\n        As a member of the Independent party, I, Tomer Almog, am proudly running for the office of Mayor. With my experience as the CTO of Good Party, I have proven myself as a capable and dedicated leader.\n    </p>\n    <p>\n        A little fun fact about me: I like turtles. But when it comes to serving my community, my enthusiasm, commitment, and passion are unmatched.\n    </p>\n    <p>\n        Throughout my career, I have prioritized the well-being of others, and as Mayor, I will continue to do so. I care deeply about the unknown, ensuring that everyone in our city has access to quality education, healthcare, and opportunities for growth.\n    </p>\n    <p class="italic">\n        It is my belief that every voice matters, and I am committed to creating an inclusive and transparent government. Together, we can build a future where our community thrives and everyone feels heard.\n    </p>\n    <p>\n        With my proven leadership skills, dedication to others, and love for our city, I am confident that I can make a positive difference as the Mayor. Vote for Tomer Almog, because together, we can create a brighter future for our community.\n    </p>\n</div>',
    mobilizing:
      '<div class="font-sans">\n  <h1 class="text-xl font-bold mb-4">Field Plan for Tomer Almog</h1>\n\n  <h2 class="text-lg font-bold mb-2">1. Voter Targeting</h2>\n  <p>Base Voters: Unknown</p>\n  <p>Persuadable Voters: Unknown</p>\n  <p>Voters Likely to Support Opponent: Republicans</p>\n  <p>Target Messages: Independents, Democrats, and Republicans</p>\n  <p>Demographics to Focus Outreach On:</p>\n  <ul>\n    <li>Age Range: 18 to 65+</li>\n    <li>Gender Breakdown: Women and Men</li>\n    <li>Party Affiliation: All parties</li>\n  </ul>\n\n  <h2 class="text-lg font-bold mb-2">2. Canvassing Strategy</h2>\n  <p>Election Day: March 11, 2024</p>\n  <p>Timeline:</p>\n  <ul>\n    <li>Week 1: Knock on 400 doors (100 doors per hour x 4 hours)</li>\n    <li>Week 2: Knock on 400 doors (100 doors per hour x 4 hours)</li>\n    <li>Week 3: Knock on 400 doors (100 doors per hour x 4 hours)</li>\n    <li>Week 4: Knock on 400 doors (100 doors per hour x 4 hours)</li>\n  </ul>\n\n  <h2 class="text-lg font-bold mb-2">3. Phone Banking</h2>\n  <p>Election Day: March 11, 2024</p>\n  <p>Timeline:</p>\n  <ul>\n    <li>Week 1: Make 192 calls (12 contacts per hour x 4 hours)</li>\n    <li>Week 2: Make 192 calls (12 contacts per hour x 4 hours)</li>\n    <li>Week 3: Make 192 calls (12 contacts per hour x 4 hours)</li>\n    <li>Week 4: Make 192 calls (12 contacts per hour x 4 hours)</li>\n  </ul>\n\n  <h2 class="text-lg font-bold mb-2">4. Voter Registration</h2>\n  <p>Zip Code for Targeted Voter Registration: 93065</p>\n\n  <h2 class="text-lg font-bold mb-2">5. Get-out-the-vote (GOTV)</h2>\n  <p>Goal: Increase Supportive Voter Turnout by 2 to 5%</p>\n\n  <h2 class="text-lg font-bold mb-2">6. Data Management</h2>\n  <p>Track Voter Contact Information, Canvassing Results, and Relevant Data</p>\n</div>',
    messageBox:
      '<div class="flex">\n  <div class="border border-gray-800 p-4">\n    <h2 class="text-lg font-bold mb-2">What I Will Say About Myself</h2>\n    <p class="text-gray-700">Hello, I am Tomer Almog, an Independent candidate running for Mayor. I am proud to be a CTO of Good Party and have a passion for public service. Fun fact about me: I like turtles.</p>\n  </div>\n  <div class="border border-gray-800 p-4">\n    <h2 class="text-lg font-bold mb-2">What I Will Say About My Opponent</h2>\n    <p class="text-gray-700">My opponent, Donald Trump, is a member of the Republican Party and has served as the President of the United States. However, I believe our visions and approaches differ greatly.</p>\n  </div>\n</div>\n\n<div class="flex">\n  <div class="border border-gray-800 p-4">\n    <h2 class="text-lg font-bold mb-2">What My Opponent Will Say About Me</h2>\n    <p class="text-gray-700">Tomer Almog, my opponent, has been associated with the Independent party and holds the position of CTO at Good Party. While he claims to care about the community, I have concerns about his lack of political experience.</p>\n  </div>\n  <div class="border border-gray-800 p-4">\n    <h2 class="text-lg font-bold mb-2">What My Opponent Will Say About Themselves</h2>\n    <p class="text-gray-700">I, Donald Trump, am a member of the Republican Party and have a long history of successful business ventures. I believe my leadership qualities and track record make me the best choice for Mayor.</p>\n  </div>\n</div>',
  },
  p2vStatus: 'Waiting',
  goals: {
    electionDate: '2024-03-11',
    campaignWebsite: 'https://tomeralmog.com',
    runningAgainst: [
      {
        name: 'Donald Trump',
        description: 'mr president',
        party: 'Republican Party',
      },
    ],
  },
  launchStatus: 'launched',
  candidateSlug: 'tomer-almog',
  aiContent: {
    pressRelease: {
      name: 'Press Release',
      updatedAt: 1700454163628,
      inputValues: {
        'Subject of Press Release': 'Announce my campaign launch',
        'Additional instructions': '',
      },
      content:
        '<div class="text-black">\n<h1 class="text-3xl font-bold mb-4">PRESS RELEASE</h1>\n\n<h2 class="text-2xl font-bold mb-2">Independent Candidate Tomer Almog Announces Candidacy for Mayor</h2>\n\n<p class="mb-2">City Name—Today, independent candidate Tomer Almog officially launched his campaign for Mayor, aiming to bring positive change and innovation to the city.</p>\n\n<p class="mb-2">Tomer Almog, currently serving as the Chief Technology Officer (CTO) of Good Party, brings a fresh perspective to the political landscape. With a background in technology, Almog aims to leverage his expertise and create a smarter, more efficient city administration.</p>\n\n<p class="mb-2">When asked about his motivation for running, Almog stated, "I strongly believe that the city has immense untapped potential. As someone who has always been passionate about making a difference, I want to utilize my skills and knowledge to shape a brighter future for our city."</p>\n\n<p class="mb-2">With a strong commitment to transparency and inclusivity, Almog intends to prioritize citizen engagement and foster collaborative decision-making. His experience in leading technical teams and driving innovation will serve as a strong foundation for implementing data-driven policies that address the needs and aspirations of the community.</p>\n\n<p class="mb-2">Tomer Almog\'s campaign is built on the core principles of integrity, accountability, and progress. He believes in empowering the city\'s residents and ensuring their voices are heard. Almog\'s dedication to improving the quality of life for all constituents is exemplified in his campaign motto, \'I like turtles\' — a slogan that symbolizes his commitment to safeguarding environmental sustainability and embracing the importance of nature in urban development.</p>\n\n<p class="mb-2">Commenting on his vision for the city, Almog said, "I envision a city that is forward-thinking, inclusive, and environmentally conscious. As Mayor, I will work tirelessly to foster economic growth, develop sustainable infrastructure, and ensure that every resident, from all walks of life, has access to essential services."</p>\n\n<p class="mb-2">In this upcoming election, voters have a clear choice. While the incumbent, Donald Trump, represents the Republican Party and is familiar to the public as the former President of the United States, Almog brings a fresh perspective, untainted by partisan politics. With a campaign built on collaboration, innovation, and honest leadership, Almog\'s candidacy offers voters a chance to vote for positive change and a brighter future.</p>\n\n<p class="mb-4">As the campaign gains momentum, the stakes couldn\'t be higher. This election will determine the future trajectory of the city, shaping policies that will impact constituents\' lives for years to come. Almog\'s commitment to addressing the pressing issues facing the city, combined with his ability to think outside the box, make him the ideal candidate to lead the city into a prosperous and sustainable future.</p>\n\n<p class="mb-2">For more information about Tomer Almog\'s campaign or to get involved, please visit www.tomeralmogformayor.com or contact our campaign headquarters at [Phone Number] or [Email Address].</p>\n\n<hr class="my-4">\n\n<p class="text-sm font-light">Note to Editors: Please use \'Tomer Almog for Mayor\' as the campaign name.</p>\n</div>',
    },
    launchSocialMediaCopy: {
      name: 'Launch Social Media Copy',
      updatedAt: 1701112624734,
      inputValues: {},
      content:
        '<div class="text-black">\n  \n  <!-- Post 1 -->\n  <h2 class="font-bold mb-4">🚀 Exciting Announcement! 🚀</h2>\n  <p>I am thrilled to announce my candidacy for the US Senate as an Independent! My name is Tomer Almog, and I am currently the CTO of Good Party. But what you may not know about me is that I like turtles...a lot! 🐢 #AlmogForSenate #IndependentCandidate</p>\n\n  <!-- Post 2 -->\n  <h2 class="font-bold mt-8 mb-4">Why I\'m Running:</h2>\n  <p>As someone deeply passionate about bringing positive change to our society, I couldn\'t sit idly by. I believe in fighting for what\'s right, and that\'s exactly what I intend to do as your US Senator. Together, we can create a brighter future for all Americans! 🇺🇸 #ChangeMakers</p>\n\n  <!-- Post 3 -->\n  <h2 class="font-bold mt-8 mb-4">My Core Issues:</h2>\n  <p>During my campaign, I will prioritize addressing key issues that matter to all Americans. From healthcare reform and economic equality to climate change and education, I am committed to finding solutions that benefit every single citizen. Let\'s make a difference together! 💪 #PeopleOverPolitics</p>\n\n  <!-- Post 4 -->\n  <h2 class="font-bold mt-8 mb-4">Election Stakes:</h2>\n  <p>This election is crucial for shaping the future of our country. It\'s time for fresh perspectives, independent voices, and inclusive policies. By supporting my campaign, you are choosing a candidate who will fight tirelessly for you, your family, and your community. Together, we can create real change! ✊ #VoteAlmog</p>\n\n  <!-- Post 5 -->\n  <h2 class="font-bold mt-8 mb-4">Join the Movement! 🙌</h2>\n  <p>I can\'t do this alone – I need your support to make a difference. Whether you volunteer, donate, or simply spread the word, every action you take matters. Together, we can build a better future for ourselves and future generations. Let\'s make history together! 🗳️ #Almog2022</p>\n\n</div>',
    },
    pressRelease2: {
      name: 'Press Release2',
      updatedAt: 1701112726323,
      inputValues: {
        'Subject of Press Release': 'announce my campaign',
        'Additional instructions': '',
      },
      content:
        '<div class="text-black">\n\n<h2 class="font-bold text-2xl">FOR IMMEDIATE RELEASE</h2>\n\n<h1 class="font-bold text-4xl">Independent Candidate Tomer Almog Announces Candidacy for U.S. Senate</h1>\n\n<p class="mt-4">City, State - Date</p>\n\n<p><strong>City, State - Date:</strong> Tomer Almog, the esteemed CTO of Good Party and a renowned figure in the tech industry, officially declares his candidacy as an independent candidate for the U.S. Senate.</p>\n\n<p>With a passion for public service and an unwavering dedication to the betterment of society, Almog seeks to bring a fresh perspective and innovative ideas to the political landscape.</p>\n\n<p>"I believe in the power of the people and the need for effective representation. As an independent candidate, I am committed to putting the interests of the American people first," said Almog.</p>\n\n<p>Tomer Almog, an advocate for diversity and inclusivity, has a proven track record of success in his role as CTO of Good Party, a prominent organization empowering individuals through technology. He has championed various initiatives aimed at bridging the digital divide, creating equal opportunities, and protecting user privacy.</p>\n\n<p>Almog\'s decision to run for the U.S. Senate stems from his deep-rooted commitment to address the pressing issues that currently plague our nation. His campaign will focus on implementing comprehensive healthcare reform, combating climate change, and fostering economic growth for all Americans.</p>\n\n<p>"I firmly believe that we have the capacity to tackle the challenges we face as a nation. By working collaboratively across party lines, we can achieve meaningful change and create a brighter future for generations to come," Almog expressed.</p>\n\n<p>Voters are presented with a unique opportunity to support an independent candidate who is not bound by partisan politics and is driven solely by the welfare of the American people.</p>\n\n<p>"My candidacy offers an alternative to the divisive politics of today. It\'s time for a new era of leadership that prioritizes unity, integrity, and forward-thinking solutions," stated Almog.</p>\n\n<p>The stakes are high in this upcoming election, as the voters of this great nation have the power to shape the course of America\'s future. By electing Tomer Almog, voters will be endorsing a candidate who is committed to restoring integrity, fostering innovation, and championing the common good.</p>\n\n<p>In contrast, Almog\'s opponent, Donald Trump, represents the Republican Party and has served as the President of the United States. This race provides an opportunity for voters to embrace a new direction, detached from partisan ties and the influence of established politicians.</p>\n\n<p>Tomer Almog\'s campaign is founded on the principles of progress, unity, and dedication to the American people. With his vast experience and fresh perspective, he seeks to bring about meaningful change and work tirelessly to ensure a brighter future.</p>\n\n<p>For media inquiries, please contact:</p>\n\n<p>John Doe<br>\nPhone: XXX-XXX-XXXX<br>\nEmail: johndoe@example.com</p>\n\n</div>',
    },
  },
};
