/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Find by slug one Candidate',

  description: 'Find by slug one Candidate ',

  inputs: {
    candidate: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Candidate Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Candidate Not Found.',
      responseType: 'notFound',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { candidate } = inputs;
      const { user } = this.req;

      const {
        slug,
        firstName,
        lastName,
        party,
        district,
        state,
        city,
        office,
        otherOffice,
        slogan,
        about,
        why,
        pastExperience,
        occupation,
        funFact,
        voteGoal,
        voterProjection,
        color,
        image,
        twitter,
        instagram,
        facebook,
        linkedin,
        tiktok,
        snap,
        twitch,
        hashtag,
        website,
        electionDate,
      } = candidate;

      let campaign = await Campaign.findOne({
        slug,
        isActive: true,
      });

      if (!campaign) {
        return exits.notFound();
      }

      const canAccess = await sails.helpers.staff.canAccess(campaign, user);
      if (!canAccess) {
        return exits.forbidden();
      }

      let campaignData = campaign.data;
      if (!campaignData) {
        return exits.notFound();
      }

      campaignData.campaignPlan = campaignData.campaignPlan || {};
      campaignData.pathToVictory = campaignData.pathToVictory || {};
      const updatedData = {
        ...campaignData,
        color,
        image,
        twitter,
        instagram,
        facebook,
        linkedin,
        tiktok,
        snap,
        twitch,
        hashtag,
        website,
        details: {
          ...campaignData.details,
          firstName,
          lastName,
          party,
          state,
          office,
          otherOffice,
          pastExperience,
          occupation,
          funFact,
          district,
          city,
          color,
          image,
          twitter,
          instagram,
          facebook,
          linkedin,
          tiktok,
          snap,
          twitch,
          hashtag,
          website,
        },
        campaignPlan: {
          ...campaignData.campaignPlan,
          slogan,
          aboutMe: about,
          why,
        },
        goals: {
          ...campaignData.goals,
          electionDate,
          campaignWebsite: website,
        },
        pathToVictory: {
          ...campaignData.pathToVictory,
          voteGoal,
          voterProjection,
        },
      };

      await Campaign.updateOne({ slug }).set({ data: updatedData });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('Error in update candidate', e);
      return exits.notFound();
    }
  },
};

const temp = {
  slug: 'tomer-almog',
  lastVisited: 1699205390602,
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
    knowRun: 'yes',
    state: 'CA',
    office: 'Mayor',
    officeTermLength: '4 years',
    otherOffice: '',
    district: '',
    city: 'Los Angeles',
    articles: '',
    runBefore: 'no',
    officeRunBefore: '',
    pastExperience: 'I like turtles',
    occupation: 'CTO of Good Party',
    funFact: 'I like turtles',
  },
  currentStep: 'profile-completed',
  lastStepDate: '2023-11-04',
  goals: {
    electionDate: '2023-11-11',
    campaignWebsite: 'https://tomeralmog.com',
    runningAgainst: [
      {
        name: 'Donald Trump',
        description: 'president',
        party: 'Republican Party',
      },
    ],
  },
  launchStatus: 'launched',
  candidateSlug: 'tomer-almog',
  campaignPlanStatus: {
    communicationsStrategy: { status: 'completed', createdAt: 1697083541528 },
    policyPlatform: { status: 'completed', createdAt: 1697083542778 },
    mobilizing: { status: 'completed', createdAt: 1697083543909 },
    why: { status: 'completed', createdAt: 1697083548899 },
    pathToVictory: { status: 'completed', createdAt: 1697083550251 },
    aboutMe: { status: 'completed', createdAt: 1697083555312 },
    messageBox: { status: 'completed', createdAt: 1697083556523 },
    slogan: { status: 'completed', createdAt: 1697083562350 },
    pressRelease: { status: 'completed', createdAt: 1698714946455 },
  },
  campaignPlan: {
    why: '<div class="my-4">\n  <p><strong>Why I\'m Running for Mayor</strong></p>\n  <p><strong class="text-blue-500">Tomer Almog</strong>, a member of the Independent party and the CTO of Good Party, is running for office of Mayor. </p>\n  <p>As someone who truly cares about the community, I believe in making a positive impact and serving the people. This is why I have decided to run for Mayor.</p>\n  <p>One important aspect of my candidacy is my understanding of the needs and aspirations of our town. I have seen first-hand how certain issues have been neglected or overlooked, and this has driven me to want to make a difference.</p>\n  <p><em>Fun fact:</em> I like turtles. This unique characteristic showcases my passion for nature and the environment, which I believe are crucial aspects of any sustainable community.</p>\n  <p>With my past experience as a CTO and my knowledge of technological advancements, I am committed to bringing innovation and modern solutions to our town. I believe that by incorporating technology in our municipal services, we can enhance efficiency and improve the quality of life for our residents.</p>\n  <p>But above all, I am driven by a deep and genuine care for the well-being of our unknown. I strongly believe that everyone deserves equal opportunities and access to essential resources. I am dedicated to promoting inclusivity, diversity, and social justice.</p>\n  <p><strong>Vote for Tomer Almog:</strong> A candidate who truly listens, understands, and is determined to shape a prosperous future for our town.</p>\n</div>',
    aboutMe:
      'I am Tomer Almog, a member of the Independent party, running for office as Mayor. With a background as the Chief Technology Officer of Good Party, I bring a wealth of experience in leadership and technology to this role. My passion for innovation and commitment to progress make me an ideal candidate for leading our community towards a brighter future. In addition to my professional achievements, I have a fun fact to share about myself - I have a love for turtles. Throughout my career, I have prioritized the wellbeing and growth of those I work with, always striving to bring out the best in others. My dedication to improving our community has led me to genuinely care about the unknown, seeking to address the needs and concerns of every individual. As Mayor, I will prioritize transparency, inclusivity, and sustainable development, working diligently to make our city a better place for all.',
    communicationsStrategy:
      '<div class="bg-white p-8 text-black">\n  <h2 class="text-2xl font-bold mb-4">Communications Plan for Tomer Almog\'s Mayor Campaign</h2>\n\n  <h3 class="text-lg font-semibold mb-2">Situation Analysis</h3>\n  <p>\n    The current political landscape is highly contested. The campaign needs to address key issues such as economic development, social equality, and environmental sustainability. The challenges include competing against a well-known opponent and gaining recognition in a crowded field.\n  </p>\n\n  <h3 class="text-lg font-semibold mb-2">Target Audience</h3>\n  <p>\n    The target audience consists of residents aged 18-45, particularly those interested in technology, community development, and environmental issues. The plan will utilize social media platforms, local publications, and community events to reach this audience effectively.\n  </p>\n\n  <h3 class="text-lg font-semibold mb-2">Message Development</h3>\n  <p>\n    Tomer Almog\'s campaign message will focus on leveraging technology for inclusive progress, empowering local communities, and promoting sustainable practices. The message will highlight his background as a CTO and emphasize the need for fresh leadership and innovative solutions.\n  </p>\n\n  <h3 class="text-lg font-semibold mb-2">Media Relations</h3>\n  <p>\n    The campaign will establish relationships with journalists and media outlets through press releases, one-on-one meetings, and media briefings. The team will provide journalists with compelling materials, including talking points and interviews, to promote positive media coverage.\n  </p>\n\n  <h3 class="text-lg font-semibold mb-2">Digital Strategy</h3>\n  <p>\n    A comprehensive social media strategy will be developed, focusing on platforms such as Twitter, Facebook, and Instagram. Engaging and shareable digital content will be created to connect with supporters, attract new audiences, and mobilize volunteers. Online platforms will also be used for targeted advertising and raising campaign funds.\n  </p>\n\n  <h3 class="text-lg font-semibold mb-2">Events and Rallies</h3>\n  <p>\n    The campaign will organize regular public events, rallies, and town hall meetings to foster enthusiasm, connect with constituents, and share Tomer Almog\'s vision for the city. These events will be promoted through social media, local advertisements, and community partnerships.\n  </p>\n\n  <h3 class="text-lg font-semibold mb-2">Fundraising</h3>\n  <p>\n    A comprehensive fundraising strategy will be implemented to meet the campaign\'s financial goals. Fundraising materials, including letters, emails, and online donation platforms, will be developed. Potential donors and fundraising opportunities will be identified through targeted outreach, including community engagements and networking events.\n  </p>\n</div>',
    policyPlatform:
      '<div class="p-8">\n  <h1 class="text-3xl font-bold mb-4">Tomer Almog for Mayor</h1>\n\n  <h2 class="text-2xl font-bold mb-4">Policy Platform</h2>\n\n  <h3 class="text-xl font-bold mt-4 mb-2">1. Affordable Housing</h3>\n  <ul class="list-disc ml-8">\n    <li>Implement rent control measures to ensure affordable housing options for all residents</li>\n    <li>Create incentives for developers to build affordable housing units in new construction projects</li>\n    <li>Establish a task force to identify and repurpose vacant lots and buildings for affordable housing initiatives</li>\n  </ul>\n\n  <h3 class="text-xl font-bold mt-4 mb-2">2. Sustainable Transportation</h3>\n  <ul class="list-disc ml-8">\n    <li>Promote the expansion of public transportation options, including investing in new routes and increasing frequency</li>\n    <li>Incentivize the use of electric vehicles through charging infrastructure development and tax credits</li>\n    <li>Create bike-friendly infrastructure with dedicated lanes and secure parking facilities</li>\n  </ul>\n\n  <h3 class="text-xl font-bold mt-4 mb-2">3. Education Reform</h3>\n  <ul class="list-disc ml-8">\n    <li>Increase funding for public schools to improve resources, teacher salaries, and student support programs</li>\n    <li>Expand access to vocational and technical education programs to provide diverse career pathways for students</li>\n    <li>Establish partnerships with local businesses to provide internships and apprenticeships for high school students</li>\n  </ul>\n\n  <h3 class="text-xl font-bold mt-4 mb-2">4. Small Business Support</h3>\n  <ul class="list-disc ml-8">\n    <li>Create a streamlined process for small business licensing and permit applications</li>\n    <li>Offer tax incentives and grants to local entrepreneurs to encourage new business startups</li>\n    <li>Develop business incubators and co-working spaces to foster innovation and collaboration</li>\n  </ul>\n\n  <h3 class="text-xl font-bold mt-4 mb-2">5. Community Engagement</h3>\n  <ul class="list-disc ml-8">\n    <li>Hold regular town hall meetings to actively listen to residents\' concerns and ideas</li>\n    <li>Establish neighborhood advisory boards to involve community members in decision-making processes</li>\n    <li>Support community events and initiatives that promote unity and inclusivity</li>\n  </ul>\n</div>',
    mobilizing:
      '<div class="text-gray-800">\n  <h1 class="text-2xl font-bold mb-4">Field Plan for Tomer Almog</h1>\n\n  <!-- Voter Targeting -->\n  <h2 class="text-lg font-bold mb-2">1. Voter Targeting</h2>\n  <ul>\n    <li><b>Base Voters:</b> Independents and Democrats</li>\n    <li><b>Persuadable Voters:</b> Republicans</li>\n    <li><b>Messages to Target:</b> Focus on appealing to independent voters with messages of change, transparency, and good governance. Democrats can be targeted with messages of progressive policies, social issues, and diversity. Republicans can be persuaded with messages emphasizing fiscal responsibility, reducing government interference, and traditional family values.</li>\n    <li><b>Demographic Focus:</b> Outreach efforts should consider age range between 18 and 65, with an emphasis on young voters (18-34) and middle-aged voters (35-54). Balance outreach efforts between men and women, ensuring equal representation.</li>\n    <li><b>Party Affiliation:</b> Independents, Democrats, and Republicans. The campaign should focus on converting independents and attracting moderate Republicans.</li>\n  </ul>\n\n  <!-- Canvassing Strategy -->\n  <h2 class="text-lg font-bold mb-2">2. Canvassing Strategy</h2>\n  <ul>\n    <li><b>Timeline:</b> Work backward from election day (2023-11-11) to establish weekly goals.</li>\n    <li><b>Weekly Door Knocking Goals:</b> Set targets for the number of doors to be knocked on each week, aiming for maximum reach and engagement. Customize goals based on available volunteer shifts.</li>\n    <li><b>Shifts:</b> Assume a shift is 4 hours of canvassing, with the ability to knock on 100 doors per hour.</li>\n  </ul>\n\n  <!-- Phone Banking -->\n  <h2 class="text-lg font-bold mb-2">3. Phone Banking</h2>\n  <ul>\n    <li><b>Timeline:</b> Work backward from election day (2023-11-11) to establish weekly goals.</li>\n    <li><b>Weekly Phone Call Goals:</b> Set targets for the number of calls to be made each week, focusing on efficient communication and information sharing. Customize goals based on available volunteer shifts.</li>\n    <li><b>Shifts:</b> Assume a shift is 4 hours of calling, with the ability to make 12 contacts per hour.</li>\n  </ul>\n\n  <!-- Voter Registration -->\n  <h2 class="text-lg font-bold mb-2">4. Voter Registration</h2>\n  <ul>\n    <li><b>Target Area:</b> Focus on areas with high numbers of unregistered voters, particularly targeting potential supporters based on zip code 93065.</li>\n    <li><b>Process:</b> Identify potential voters who are not registered and provide them with information about the registration process. Offer assistance in helping them register to vote.</li>\n  </ul>\n\n  <!-- Get-Out-The-Vote (GOTV) -->\n  <h2 class="text-lg font-bold mb-2">5. Get-Out-The-Vote (GOTV)</h2>\n  <ul>\n    <li><b>Strategy:</b> Develop a plan to remind supporters to vote, provide them with information about polling locations and hours, and offer transportation if needed.</li>\n    <li><b>Goal:</b> Aim to increase supportive voter turnout by 2 to 5%. Implement targeted outreach efforts to ensure supporters actually show up to vote on election day.</li>\n  </ul>\n\n  <!-- Data Management -->\n  <h2 class="text-lg font-bold mb-2">6. Data Management</h2>\n  <ul>\n    <li><b>Data Tracking:</b> Implement a comprehensive system to manage voter contact information, canvassing results, and other relevant data. Use this data to target campaign efforts more effectively and make informed strategic decisions.</li>\n  </ul>\n\n  <p class="mt-4">Overall, this field plan aims to target the right voters, effectively engage them through canvassing and phone banking, ensure voter registration, maximize voter turnout, and utilize data management for a successful campaign. The plan should be flexible and adaptable to changing circumstances throughout the election period.</p>\n</div>',
    messageBox:
      '<div class="grid grid-cols-2 gap-4">\n  <div class="p-4 border border-gray-300">\n    <h2 class="text-lg font-bold mb-2">What I will say about myself</h2>\n    <p class="text-base">Hi, I\'m Tomer Almog, and I\'m running for Mayor as an Independent candidate. As the CTO of Good Party, I bring a wealth of knowledge and experience to the table. Did you know that I also have a passion for turtles? Together, let\'s create a brighter future for our community!</p>\n  </div>\n\n  <div class="p-4 border border-gray-300">\n    <h2 class="text-lg font-bold mb-2">What I will say about my opponent</h2>\n    <p class="text-base">My opponent, Donald Trump, is a member of the Republican Party and currently serves as the president. While we may have different visions for our city, I respect his dedication to public service. Let\'s engage in a healthy, productive debate that focuses on the best interests of our constituents.</p>\n  </div>\n\n  <div class="p-4 border border-gray-300">\n    <h2 class="text-lg font-bold mb-2">What my opponent will say about me</h2>\n    <p class="text-base">Tomer Almog claims to be an Independent candidate with experience as the CTO of Good Party. However, his past experience seems unclear since he keeps mentioning his love for turtles. Can we really trust someone who prioritizes turtles over practical qualifications for the position of Mayor?</p>\n  </div>\n\n  <div class="p-4 border border-gray-300">\n    <h2 class="text-lg font-bold mb-2">What my opponent will say about themself</h2>\n    <p class="text-base">As a member of the Republican Party and the current president, I, Donald Trump, have successfully navigated numerous challenges and brought about positive change. My track record speaks for itself, and I will continue to prioritize the interests of our citizens if re-elected as Mayor.</p>\n  </div>\n</div>',
    slogan:
      '"Almog for Mayor: Independent Leader Building a Better Future Together!"',
    pathToVictory:
      '<div class="p-5">\n   <h2 class="text-2xl font-bold">Candidate Information:</h2>\n   <ul class="list-disc pl-5">\n      <li><span class="font-bold">Candidate Name:</span> Tomer Almog</li>\n      <li><span class="font-bold">Office Running For:</span> Mayor</li>\n      <li><span class="font-bold">Political Party:</span> Independent</li>\n      <li><span class="font-bold">Election Date:</span> 2023-11-11</li>\n      <li><span class="font-bold">Total Registered Voters:</span> [[totalRegisteredVoters]]</li>\n      <li><span class="font-bold">Average % Turnout:</span> [[averageTurnout]]</li>\n      <li><span class="font-bold">Projected Turnout:</span> [[projectedTurnout]]</li>\n   </ul>\n</div>\n\n<div class="p-5">\n   <h2 class="text-2xl font-bold">Votes Needed from Each Political Affiliation:</h2>\n   <p>To reach the win number of [[winNumber]], the following votes are needed from each political affiliation based on Voter Registration:</p>\n   <ul class="list-disc pl-5">\n      <li><span class="font-bold">Democrats:</span> [calculated value]</li>\n      <li><span class="font-bold">Republicans:</span> [calculated value]</li>\n      <li><span class="font-bold">Independents:</span> [calculated value]</li>\n   </ul>\n</div>\n\n<div class="p-5">\n   <h2 class="text-2xl font-bold">Tactics for Turning Out Votes:</h2>\n   <ul class="list-disc pl-5">\n      <li><span class="font-bold">Democrats:</span> [list specific tactics for turning out votes from Democrats]</li>\n      <li><span class="font-bold">Republicans:</span> [list specific tactics for turning out votes from Republicans]</li>\n      <li><span class="font-bold">Independents:</span> [list specific tactics for turning out votes from Independents]</li>\n   </ul>\n</div>',
  },
  p2vStatus: 'Waiting',
  pathToVictory: {
    totalRegisteredVoters: '300',
    projectedTurnout: '200',
    winNumber: 102,
    voterContactGoal: '500',
    republicans: 0,
    democrats: 0,
    indies: 0,
    averageTurnout: 0,
    allAvailVoters: 0,
    availVotersTo35: 0,
    women: 0,
    men: 0,
    africanAmerican: 0,
    white: 0,
    asian: 0,
    hispanic: 0,
    voteGoal: '4000',
    voterProjection: '5000',
    budgetLow: 0,
    budgetHigh: 0,
    voterMap: '',
    finalVotes: 0,
  },
  aiContent: {
    pressRelease: {
      name: 'Press Release',
      updatedAt: 1698714961534,
      inputValues: {
        'Subject of Press Release': 'Announcing my campaign launch,',
        'Additional instructions': '',
      },
      content:
        "FOR IMMEDIATE RELEASE\n\nAnnouncing the Launch of Tomer Almog's Independent Campaign for Mayor\n\nHumanizing Politics and Prioritizing the People\n\n[City Name], [State], [Date] - Tomer Almog, a renowned CTO and an advocate for positive change, is proud to announce his candidacy for Mayor of [City Name]. As the head of his own party, the Good Party, Almog brings fresh perspectives and a genuine passion for making a difference in the lives of the people he aims to represent.\n\nBorn and raised in [City Name], Tomer Almog has always been deeply connected to his community. With an accomplished career in the technology industry, he has honed his leadership skills and acquired a sharp understanding of the challenges faced by the citizens of [City Name]. Almog's campaign slogan, \"Humanizing Politics and Prioritizing the People,\" reflects his commitment to bringing a more compassionate and transparent approach to local governance.\n\nWhen asked about his reasons for entering the political arena, Almog expressed his desire to break free from the limitations of traditional party platforms. He firmly believes that by running as an Independent candidate, he can foster innovative and collaborative solutions that prioritize the needs and aspirations of the people, rather than serving partisan interests. Almog believes that local governance should be an inclusive process that encourages the active participation of all community members, regardless of their party affiliation.\n\nIn his own words, Almog states, \"I am running for Mayor because I genuinely care about the well-being of our community. I believe in creating opportunities for all and eliminating the systemic barriers that hinder our progress. Together, we can build a city that is inclusive, fair, and prosperous for everyone.\"\n\nReflecting on the current political landscape, Almog acknowledges that it is time for a change. He believes that it is crucial for the people to elect leaders who are not defined by their party affiliations but rather their dedication to service. Almog offers a fresh perspective, untainted by the political games that often overshadow the needs and desires of the electorate. By supporting Almog's campaign, voters have the opportunity to voice their demands for a new era of local governance, one that amplifies their voices and addresses their concerns.\n\nThis upcoming election presents a defining moment for the citizens of [City Name]. The stakes are high, as the city faces critical issues that require immediate attention. Almog firmly believes that our city deserves leadership that goes beyond mere rhetoric and takes tangible action. By prioritizing core issues such as affordable housing, sustainable infrastructure, and equitable education, Almog aims to usher in a brighter future for [City Name].\n\nWhile his opponent, Donald Trump, may hold the title of President, it is important to recognize that municipal governance deserves independent focus and dedicated leadership. Almog's expertise as the CTO of the Good Party, combined with his knowledge of local issues, uniquely position him to lead our city to success.\n\nAs the campaign for Mayor of [City Name] commences, Tomer Almog challenges the citizens to embrace a new era of politics where the people come first. With his extensive knowledge, passion, and desire for positive change, Almog has the potential to redefine local governance and improve the lives of all residents.\n\nFor media inquiries, please contact:\n\n[Your Name]\nCampaign Manager\nPhone: [Phone Number]\nEmail: [Email Address]\n\n###\n\nNote to Editor:\n\nThis press release adheres to the guidelines stipulated for the promotion of Tomer Almog's campaign for Mayor of [City Name]. Please ensure its publication in the next available news cycle. Thank you for your timely consideration.",
    },
  },
  profile: { completed: true },
};
