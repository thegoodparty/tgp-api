module.exports = {
  friendlyName: 'All Candidates',

  description: 'admin call for getting all candidates',

  inputs: {},

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error getting candidates',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const candidates = await Candidate.find({ isActive: false }).sort([
        { updatedAt: 'DESC' },
      ]);

      return exits.success({
        candidates,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at admin/hidden-candidates',
        e,
      );
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};

var i = {
  slug: 'ranjan-pravash',
  lastVisited: 1690399344618,
  details: {
    firstName: 'Ranjan',
    lastName: 'Pravash',
    zip: '76453',
    dob: '1981-06-18',
    citizen: 'yes',
    party: 'Libertarian Party',
    otherParty: '',
    knowRun: 'yes',
    state: 'FL',
    office: 'State House of Representatives',
    district: 'City1, District1, Council1, Town1',
    articles: '',
    runBefore: 'yes',
    officeRunBefore: 'Office1 USA',
    pastExperience:
      'Tell us about your past experiences and why you want to run for office\nTell potential voters about your prior experience. Any work or experiences that are relevant to the role you plan to run for will increase your odds of gaining their support.Tell us about your past experiences and why you want to run for office\nTell potential voters about your prior experience. Any work or experiences that are relevant to the role you plan to run for will increase your odds of gaining their support.',
    occupation: 'Member of Legislative Assembly',
    funFact:
      "What is a fun fact about yourself?\nWhat's something fun or interesting about you- unrelated to politics- that you think people in your community would like to know?What is a fun fact about yourself?\nWhat's something fun or interesting about you- unrelated to politics- that you think people in your community would like to know?What is a fun fact about yourself?\nWhat's something fun or interesting about you- unrelated to politics- that you think people in your community would like to know?",
    topIssues: {
      'position-14':
        "ROLE\n\nAn MLA may be required to fulfill as many as four distinct roles:\n\nThe role of Legislator involves understanding the spirit of existing laws, planning new laws, and studying, discussing and then supporting or opposing the enactment of new laws.\n\nAs a Representative of their constituency, a Member may voice concerns on behalf of constituents, represent viewpoints or intercede and assist in problem solving.\n\nAn MLA is also a Member of an elected party caucus.  In this function, they may be involved in planning and orchestrating strategy in the House, supporting the caucus and its decisions, and developing expertise in given subject areas.\n\nDepending on their party's political fortunes, the MLA may serve as a Cabinet Minister or Opposition Critic.",
      positions: [
        {
          createdAt: 1649095556923,
          updatedAt: 1649105503227,
          id: 14,
          name: 'Abortion is Healthcare',
          topIssue: {
            createdAt: 1649095556919,
            updatedAt: 1649095556919,
            id: 10,
            name: 'Abortion',
          },
        },
        {
          createdAt: 1649095556946,
          updatedAt: 1649105489377,
          id: 18,
          name: 'Abortion Is Murder',
          topIssue: {
            createdAt: 1649095556919,
            updatedAt: 1649095556919,
            id: 10,
            name: 'Abortion',
          },
        },
        {
          createdAt: 1649095557565,
          updatedAt: 1649095557565,
          id: 151,
          name: 'Cap Credit Card Interest',
          topIssue: {
            createdAt: 1649095557558,
            updatedAt: 1649095557558,
            id: 32,
            name: 'Banking',
          },
        },
      ],
      'position-18':
        "MLA DUTIES\n\nMembers of the Legislative Assembly divide their time between their constituencies and their work in the Assembly. MLAs duties will vary, depending on whether they are a Member of Cabinet, a Member of the Opposition, or a Government Backbencher.\n\nOpposition Members spend much of their time researching and asking questions in the House regarding their constituencies and critic areas. Both Opposition Members and Government Backbenchers present Petitions, Resolutions, and Private Members' Bills to the House.\n\nMLAs who are Ministers of the Crown (Cabinet Members) spend much of their time overseeing the operations of their assigned departments. Cabinet Ministers must be prepared to answer questions from the Opposition, put forward Government Bills, and deal with the Estimates and Annual Reports of their departments.\n\nMLAs also serve as Members of various committees.  Committee membership is allocated to the political parties in approximately the same proportion as their represen",
      'position-151':
        "The Legislative Assembly is an independent entity, separate from the Government of Manitoba. The 57 Members of the Assembly are elected in single-member constituencies to represent the people of Manitoba.\n\nManitoba's Legislative Building is reputed to be one of the most impressive public buildings in North America. The building accommodates the Legislative Assembly, its committees and staff, as well as offices for the Premier, the Lieutenant Governor and the ministers and deputy ministers of all government departments. ",
    },
    pledged: true,
  },
  currentStep: 'launch-20',
  lastStepDate: '2023-07-26',
  campaignPlanStatus: {
    why: 'completed',
    slogan: 'completed',
    aboutMe: 'completed',
    policyPlatform: 'completed',
    communicationsStrategy: 'completed',
    messageBox: 'completed',
    operationalPlan: 'completed',
    mobilizing: 'completed',
    pathToVictory: 'completed',
    timeline: 'completed',
  },
  campaignPlan: {
    slogan:
      '"Liberty for all: Pravash for State House - Support Individual Freedom"',
    aboutMe:
      "Hi, my name is Ranjan Pravash and I am running for office in the State House of Representatives in City1, District1, Council1, Town1 as a member of the Libertarian Party. I have been actively involved in politics for many years and currently serve as a Member of the Legislative Assembly. One fun fact about me is that I am an avid hiker and have climbed several mountains in the area. I believe that it's important for people to know more about the candidates they are voting for beyond just their political beliefs, and I want to share that side of me with my community. In terms of my past experiences, I have worked in various roles within the government and have gained a deep understanding of the legislative process. I am passionate about advocating for the rights of individuals and believe in limited government intervention. I want to use my knowledge and experience to make a positive impact on the lives of the people in District1. I am dedicated to fighting for issues that matter, such as healthcare and the right to make individual choices. I believe that abortion is a personal healthcare decision and should be accessible and safe for all individuals. As an MLA, I will work towards ensuring that healthcare choices, including abortion, are protected and accessible to all. I am committed to serving the people of District1 and being their voice in the State House of Representatives. Thank you for considering me as your representative.",
    why: 'I am Ranjan Pravash, and I am running for the State House of Representatives in City1, District1, Council1, Town1 as a member of the Libertarian Party party. As a Member of Legislative Assembly, I believe it is important to represent the diverse views and concerns of my constituents. With my prior experience as a member of the legislature, I have a deep understanding of the legislative process and am committed to advocating for the rights and interests of the people I serve. Outside of politics, I enjoy playing the harmonium and have been performing in local cultural events for over a decade. I believe this fun fact about myself is something that people in my community would appreciate, as it shows my dedication to both my culture and my community. If elected, I will prioritize important issues such as healthcare, including supporting access to abortion as a vital component of healthcare for women. By working as a legislator, representative, and member of the libertarian party caucus, I aim to bring a fresh perspective and valuable contributions to the State House of Representatives, ensuring that the voices of the people are heard and their needs are met.',
    policyPlatform:
      '<div class="max-w-lg mx-auto p-8 bg-gray-100 border border-gray-300 shadow">\n  <h2 class="text-2xl font-semibold mb-4">Ranjan Pravash\'s Policy Platform</h2>\n  \n  <h3 class="text-lg font-semibold mb-2">1. Abortion is Healthcare - Abortion ROLE</h3>\n  <ul class="list-disc pl-6 mb-4">\n    <li>Supports the right to abortion as an essential healthcare service</li>\n    <li>Advocates for comprehensive reproductive healthcare access for all individuals</li>\n    <li>Believes in the importance of maintaining bodily autonomy and individual freedom of choice</li>\n  </ul>\n  \n  <h3 class="text-lg font-semibold mb-2">2. Abortion Is Murder - Abortion MLA DUTIES</h3>\n  <ul class="list-disc pl-6 mb-4">\n    <li>Prioritizes voicing concerns and representing constituents\' viewpoints regarding abortion issues</li>\n    <li>Works towards improving accessibility and availability of reproductive healthcare in the constituency</li>\n    <li>Engages in legislative activities to protect and support pro-life values related to abortion</li>\n  </ul>\n  \n  <h3 class="text-lg font-semibold mb-2">3. Cap Credit Card Interest - Banking</h3>\n  <ul class="list-disc pl-6">\n    <li>Advocates for implementing caps on credit card interest rates to protect consumers</li>\n    <li>Promotes financial fairness and responsible lending practices in the banking industry</li>\n    <li>Works towards creating a more transparent and accountable banking system for consumers</li>\n  </ul>\n</div>',
    messageBox:
      '<div class="flex flex-col">\n  <div class="bg-blue-500 p-4 text-white">\n    <h2 class="text-lg font-semibold">What I Will Say About Myself</h2>\n    <p>Ranjan Pravash is a highly experienced Member of Legislative Assembly who is dedicated to serving the people of City1, District1, Council1, Town1. With a strong background in understanding existing laws and planning new ones, Ranjan is committed to enacting positive change.</p>\n  </div>\n  <div class="bg-red-500 p-4 text-white">\n    <h2 class="text-lg font-semibold">What I Will Say About My Opponent</h2>\n    <p>My opponent from the Libertarian Party does not have the necessary experience and expertise required for the role of State House Representative. Their party\'s approach of limiting the size and scope of government may hinder progress and effective governance in our district.</p>\n  </div>\n  <div class="bg-yellow-500 p-4 text-white">\n    <h2 class="text-lg font-semibold">What My Opponent Will Say About Me</h2>\n    <p>My opponent will likely claim that I am part of the political establishment and criticize my past experiences as a member of the Legislative Assembly. They may argue that I am not a true advocate for limited government and individual liberties.</p>\n  </div>\n  <div class="bg-green-500 p-4 text-white">\n    <h2 class="text-lg font-semibold">What My Opponent Will Say About Themselves</h2>\n    <p>My opponent will highlight the principles of the Libertarian Party, emphasizing their commitment to civil liberties, non-interventionism, and laissez-faire capitalism. They will position themselves as a candidate who champions limited government and fights against government overreach.</p>\n  </div>\n</div>',
    communicationsStrategy:
      '<div class="container mx-auto">\n\n  <h1 class="text-3xl font-bold mb-4">Communications Plan for Ranjan Pravash\'s State House of Representatives Campaign</h1>\n\n  <div class="mb-8">\n    <h2 class="text-2xl font-semibold mb-2">1. Situation Analysis</h2>\n    <p>\n      As a candidate for State House of Representatives in City1, District1, Council1, and Town1, it is essential to conduct a thorough situation analysis of the current political landscape. This involves identifying the key issues and challenges that the campaign needs to address. We will consider factors such as the demographics, socioeconomic status, and political affiliations of the constituents in the district.\n    </p>\n  </div>\n\n  <div class="mb-8">\n    <h2 class="text-2xl font-semibold mb-2">2. Target Audience</h2>\n    <p>\n      Our target audience(s) will consist of the constituents in City1, District1, Council1, and Town1. It is crucial to define the demographics, interests, and concerns of the target audience(s). We will gather data on their age, gender, educational background, and specific issues important to them. This information will help us identify the best channels to reach and engage with the target audience(s).\n    </p>\n  </div>\n\n  <div class="mb-8">\n    <h2 class="text-2xl font-semibold mb-2">3. Message Development</h2>\n    <p>\n      To resonate with the target audience(s), we will craft a clear, concise, and compelling message. This message will address the issues that are most important to the constituents of City1, District1, Council1, and Town1. It will emphasize the candidate\'s commitment to Libertarian principles, civil liberties, non-interventionism, laissez-faire capitalism, and limiting the size and scope of government.\n    </p>\n  </div>\n\n  <div class="mb-8">\n    <h2 class="text-2xl font-semibold mb-2">4. Media Relations</h2>\n    <p>\n      Building strong relationships with journalists and media outlets is crucial for the campaign\'s success. We will identify opportunities for media coverage and develop press releases, talking points, and other materials to support media outreach. By effectively engaging with the media, we can ensure that the candidate\'s message reaches a broader audience.\n    </p>\n  </div>\n\n  <div class="mb-8">\n    <h2 class="text-2xl font-semibold mb-2">5. Digital Strategy</h2>\n    <p>\n      A strong digital strategy is essential in today\'s political landscape. We will develop a comprehensive social media strategy, creating compelling digital content that highlights the candidate\'s positions and values. Through online platforms, we will engage with supporters, reach new audiences, and mobilize volunteers to support the campaign.\n    </p>\n  </div>\n\n  <div class="mb-8">\n    <h2 class="text-2xl font-semibold mb-2">6. Events and Rallies</h2>\n    <p>\n      Organizing public events, rallies, and other activities is an effective way to generate enthusiasm for the campaign and mobilize supporters. We will plan and execute engaging events that allow constituents to connect with Ranjan Pravash, creating a positive and memorable campaign experience.\n    </p>\n  </div>\n\n  <div class="mb-8">\n    <h2 class="text-2xl font-semibold mb-2">7. Fundraising</h2>\n    <p>\n      Developing a robust fundraising strategy is critical to the campaign\'s success. We will set clear fundraising goals and develop materials such as donation appeals and fundraising events. We will identify potential donors and fundraising opportunities to ensure that the campaign has the necessary resources to compete effectively.\n    </p>\n  </div>\n\n  <div class="mb-8">\n    <h2 class="text-2xl font-semibold mb-2">About Ranjan Pravash</h2>\n    <p>\n      Ranjan Pravash is a member of the Libertarian Party and a Member of the Legislative Assembly. Before running for office, he gained valuable experience in relevant roles that make him well-suited for the position he seeks. Ranjan Pravash cares deeply about issues such as abortion as healthcare and cap credit card interest. In addition to his political background, he also has fun and interesting facts about himself unrelated to politics that the community would enjoy knowing.\n    </p>\n  </div>\n\n  <div class="mb-8">\n    <h2 class="text-2xl font-semibold mb-2">About the Race</h2>\n    <p>\n      Ranjan Pravash is running for State House of Representatives in City1, District1, Council1, and Town1 against the candidate from the My Own Party. The Libertarian Party, which Ranjan Pravash represents, promotes civil liberties, non-interventionism, laissez-faire capitalism, and limiting the size and scope of government. The election date is set for 2023-07-27.\n    </p>\n  </div>\n\n</div>',
    pathToVictory:
      'Total Votes Secured / Win Number: 4321\n\nTo secure the win number of 4321, Ranjan Pravash will need to gain support from voters across party lines, including Republicans, Democrats, and Independents. Here is a breakdown of the vote goals by party affiliation:\n\n1. Independents:\n   - Registered Independents: 4532\n   - Target Vote Share: To secure 4321 votes, Ranjan Pravash will need to aim for a high turnout among Independents. The target vote share will be approximately 95% of registered Independents, which translates to 4305 votes.\n\n2. Republicans:\n   - Registered Republicans: 232\n   - Target Vote Share: While the Libertarian Party may attract some Republican voters due to their common emphasis on limited government, the target vote share among Republicans will be modest. Assuming a 20% vote share, Ranjan Pravash should aim to secure around 46 votes from registered Republicans.\n\n3. Democrats:\n   - Registered Democrats: 345\n   - Target Vote Share: Similarly, the target vote share among Democrats will be relatively small. Assuming a 15% vote share, Ranjan Pravash should aim to secure approximately 52 votes from registered Democrats.\n\nBy focusing on a strong appeal to Independent voters while also aiming to attract a smaller percentage of votes from Republicans and Democrats, Ranjan Pravash can secure the win number of 4321 in the State House of Representatives race in City1, District1, Council1, Town1.',
    timeline:
      '<div class="p-8">\n    <h2 class="text-2xl font-bold mb-4">Campaign Plan Timeline for Ranjan Pravash</h2>\n\n    <h3 class="text-xl font-bold mb-2">Launch Date: 2023-04-27</h3>\n\n    <h4 class="text-lg font-bold mb-2">Key Dates:</h4>\n    <ul class="mb-4">\n        <li>Voter Registration Deadline: 2023-06-27</li>\n        <li>Get Out the Vote Campaign Launch: 2023-06-27</li>\n        <li>Early Voting Begins: 2023-07-03</li>\n        <li>Election Day: 2023-07-27</li>\n    </ul>\n\n    <h4 class="text-lg font-bold mb-2">Timeline:</h4>\n    <ul>\n        <li class="mb-2">Week 1 (2023-04-27 to 2023-05-03):\n            <ul>\n                <li>Set up campaign headquarters and establish a campaign team.</li>\n                <li>Develop campaign messaging and branding.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 2 (2023-05-04 to 2023-05-10):\n            <ul>\n                <li>Launch campaign website and social media channels.</li>\n                <li>Start collecting contact information for independent voters.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 3 (2023-05-11 to 2023-05-17):\n            <ul>\n                <li>Begin outreach to influential community members for endorsements.</li>\n                <li>Plan and schedule campaign events and fundraisers.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 4 (2023-05-18 to 2023-05-24):\n            <ul>\n                <li>Launch targeted digital advertising campaigns.</li>\n                <li>Start door-to-door canvassing in key neighborhoods.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 5 (2023-05-25 to 2023-05-31):\n            <ul>\n                <li>Host campaign kickoff rally.</li>\n                <li>Continue door-to-door canvassing and phone banking.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 6 (2023-06-01 to 2023-06-07):\n            <ul>\n                <li>Hold town hall meetings and community forums to engage voters.</li>\n                <li>Send out campaign newsletters or mailers.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 7 (2023-06-08 to 2023-06-14):\n            <ul>\n                <li>Expand outreach efforts to include radio and TV interviews.</li>\n                <li>Continue voter contact through canvassing, phone banking, and text messaging.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 8 (2023-06-15 to 2023-06-21):\n            <ul>\n                <li>Launch get out the vote campaign.</li>\n                <li>Encourage early voting and provide transportation assistance for voters.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 9 (2023-06-22 to 2023-06-28):\n            <ul>\n                <li>Continue get out the vote efforts with increased intensity.</li>\n                <li>Remind voters of the upcoming election and polling locations.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 10 (2023-06-29 to 2023-07-05):\n            <ul>\n                <li>Finalize campaign advertisements and messaging.</li>\n                <li>Monitor early voting turnout and adjust strategies if necessary.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 11 (2023-07-06 to 2023-07-12):\n            <ul>\n                <li>Continue get out the vote efforts and target specific demographics.</li>\n                <li>Organize Election Day volunteers and poll watchers.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 12 (2023-07-13 to 2023-07-19):\n            <ul>\n                <li>Execute last push for voter turnout.</li>\n                <li>Thank volunteers and supporters for their efforts.</li>\n            </ul>\n        </li>\n        <li class="mb-2">Week 13 (2023-07-20 to 2023-07-27):\n            <ul>\n                <li>Election Day activities, including monitoring polling locations and ensuring a smooth voting process.</li>\n                <li>Post-election wrap-up and evaluation.</li>\n            </ul>\n        </li>\n    </ul>\n</div>',
    mobilizing:
      '\n<div class="bg-white p-4 rounded-lg shadow">\n  <h2 class="text-xl font-bold mb-4">Field Plan for Ranjan Pravash</h2>\n\n  <h3 class="text-lg font-semibold mb-2">1. Voter Targeting:</h3>\n  <ul class="list-disc ml-6 mb-4">\n    <li>Suggest targeting 4532 Independents, 345 Democrats, and 232 Republicans with specific messages.</li>\n    <li>Focus outreach on demographics including women and men, with a breakdown of 2332 women and 2343 men.</li>\n    <li>Consider targeting specific age ranges based on minimum [[ageMin]] and maximum age of [[ageMax]].</li>\n  </ul>\n\n  <h3 class="text-lg font-semibold mb-2">2. Canvassing Strategy:</h3>\n  <ul class="list-disc ml-6 mb-4">\n    <li>Recruit and train volunteers for door-to-door canvassing.</li>\n    <li>Develop materials such as scripts and literature for canvassers.</li>\n    <li>Work backwards from election day [[electiondate]] to set weekly door knocking goals with shifts required to complete them. Assume a shift is 4 hours of canvassing and 100 doors can be knocked on in an hour.</li>\n  </ul>\n\n  <h3 class="text-lg font-semibold mb-2">3. Phone Banking:</h3>\n  <ul class="list-disc ml-6 mb-4">\n    <li>Recruit and train volunteers for phone banking.</li>\n    <li>Provide volunteers with information about the candidate or issue.</li>\n    <li>Work backwards from election day [[electiondate]] to set weekly phone call goals with shifts required to complete them. Assume a shift is 4 hours of calling and 12 contacts per hour.</li>\n  </ul>\n\n  <h3 class="text-lg font-semibold mb-2">4. Voter Registration:</h3>\n  <ul class="list-disc ml-6 mb-4">\n    <li>Identify potential voters in the zip code 76453 who are not registered to vote.</li>\n    <li>Provide information and assistance to help them register to vote.</li>\n  </ul>\n\n  <h3 class="text-lg font-semibold mb-2">5. Get-out-the-Vote (GOTV):</h3>\n  <ul class="list-disc ml-6 mb-4">\n    <li>Develop a comprehensive plan to remind supporters to vote on election day.</li>\n    <li>Provide information about polling locations and hours.</li>\n    <li>Consider providing transportation to the polls if necessary.</li>\n    <li>Create a plan to increase supportive voter turnout by 2 to 5%.</li>\n  </ul>\n\n  <h3 class="text-lg font-semibold mb-2">6. Data Management:</h3>\n  <ul class="list-disc ml-6 mb-4">\n    <li>Implement a data management system to track voter contact information and canvassing results.</li>\n    <li>Use data to target campaign efforts more effectively.</li>\n  </ul>\n\n  <p>Overall, this field plan for Ranjan Pravash should aim to engage targeted voters, expand the base of support, and ensure that supporters actually show up to vote. It should be flexible enough to adapt to changing circumstances and designed to achieve the campaign\'s goals.</p>\n</div>',
    operationalPlan:
      '<div>\n   <h2>Campaign Finance Plan</h2>\n   <table>\n      <thead>\n         <tr>\n            <th>Month</th>\n            <th>Total Fundraising Goal</th>\n            <th>Funds Raised through Phone Calls</th>\n            <th>Funds Raised through Fundraising Events</th>\n            <th>Funds Raised through Online Fundraising</th>\n            <th>Total Funds Raised</th>\n            <th>Campaign Expenditure (Door Knocking)</th>\n            <th>Campaign Expenditure (Digital Advertising/Impressions)</th>\n            <th>Campaign Expenditure (Text Messaging SMS)</th>\n            <th>Remaining Funds</th>\n         </tr>\n      </thead>\n      <tbody>\n         <tr>\n            <td>Today (This Month)</td>\n            <td>$10,000</td>\n            <td>$3,500</td>\n            <td>$2,000</td>\n            <td>$4,500</td>\n            <td>$10,000</td>\n            <td>$2,000</td>\n            <td>$5,500</td>\n            <td>$3,500</td>\n            <td>$0</td>\n         </tr>\n         <tr>\n            <td>Month 1</td>\n            <td>$15,000</td>\n            <td>$5,250</td>\n            <td>$3,000</td>\n            <td>$6,750</td>\n            <td>$15,000</td>\n            <td>$3,000</td>\n            <td>$9,250</td>\n            <td>$5,250</td>\n            <td>$0</td>\n         </tr>\n         <tr>\n            <td>Month 2</td>\n            <td>$20,000</td>\n            <td>$7,000</td>\n            <td>$4,000</td>\n            <td>$9,000</td>\n            <td>$20,000</td>\n            <td>$4,000</td>\n            <td>$11,000</td>\n            <td>$7,000</td>\n            <td>$0</td>\n         </tr>\n         <tr>\n            <td>Month 3</td>\n            <td>$25,000</td>\n            <td>$8,750</td>\n            <td>$5,000</td>\n            <td>$11,250</td>\n            <td>$25,000</td>\n            <td>$5,000</td>\n            <td>$13,750</td>\n            <td>$8,750</td>\n            <td>$0</td>\n         </tr>\n         <tr>\n            <td>Month 4</td>\n            <td>$30,000</td>\n            <td>$10,500</td>\n            <td>$6,000</td>\n            <td>$13,500</td>\n            <td>$30,000</td>\n            <td>$6,000</td>\n            <td>$16,500</td>\n            <td>$10,500</td>\n            <td>$0</td>\n         </tr>\n         <tr>\n            <td>Month 5</td>\n            <td>$35,000</td>\n            <td>$12,250</td>\n            <td>$7,000</td>\n            <td>$15,750</td>\n            <td>$35,000</td>\n            <td>$7,000</td>\n            <td>$19,250</td>\n            <td>$12,250</td>\n            <td>$0</td>\n         </tr>\n         <tr>\n            <td>Month 6</td>\n            <td>$39,874</td>\n            <td>$13,955.90</td>\n            <td>$7,969.60</td>\n            <td>$17,948.50</td>\n            <td>$39,874</td>\n            <td>$7,969.60</td>\n            <td>$21,930.70</td>\n            <td>$13,955.90</td>\n            <td>$0</td>\n         </tr>\n         <tr>\n            <td>Election Month</td>\n            <td>$42,100</td>\n            <td>$14,735</td>\n            <td>$8,420</td>\n            <td>$18,945</td>\n            <td>$42,100</td>\n            <td>$8,420</td>\n            <td>$23,155</td>\n            <td>$14,735</td>\n            <td>$0</td>\n         </tr>\n      </tbody>\n   </table>\n   <br />\n   <h2>Campaign Finance Summary</h2>\n   <p>Total Funds Raised throughout the Campaign: $342,324</p>\n   <br />\n   <h2>Note</h2>\n   <p>This comprehensive campaign finance plan provides a structured breakdown of the monthly fundraising goals and expenditure plans from today until the election date of 2023-07-27. The allocation of funds raised and campaign expenditure is balanced to ensure an effective utilization of resources. The fundraising efforts are designed to progressively increase, reaching a peak during the months leading up to the election. The summary line highlights the total amount of money raised throughout the campaign, allowing the candidate to track their financial progress and make necessary adjustments to their strategies.</p>\n</div>',
  },
  goals: {
    filedStatement: 'yes',
    campaignCommittee: 'statement of candidacy Campaign 1',
    electionDate: '2023-07-27',
    runningAgainst: [
      {
        name: 'My Own Party',
        description:
          'The Libertarian Party (LP) is a political party in the United States that promotes civil liberties, non-interventionism, laissez-faire capitalism, and limiting the size and scope of government. The party was conceived in August 1971 at meetings in the home of David F. Nolan in Westminster, Colorado,[11][12] and was officially formed on December 11, 1971, in Colorado Springs.[12] The organizers of the party drew inspiration from the works and ideas of the prominent Austrian school economist, Murray Rothbard.[13] The founding of the party was prompted in part due to concerns about the Nixon administration, the Vietnam War, conscription, and the introduction of fiat money.',
        party: 'Libertarian Party',
      },
    ],
  },
  pathToVictory: {
    totalRegisteredVoters: '9424',
    projectedTurnout: '8472',
    winNumber: 4321,
    voterContactGoal: '230',
    republicans: '232',
    democrats: '345',
    indies: '4532',
    averageTurnout: '40',
    allAvailVoters: '33323',
    availVotersTo35: '2323',
    women: '2332',
    men: '2343',
    africanAmerican: '2342',
    white: '2442',
    asian: '2434',
    hispanic: '2345',
    voteGoal: '2342',
    voterProjection: '234223',
    budgetLow: '342324',
    budgetHigh: '111111',
  },
  profile: { completed: true },
  team: { completed: true },
  social: { completed: true },
  finance: { ein: true, management: true, regulatory: true, filing: true },
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
  candidateSlug: 'ranjan-pravash',
};
