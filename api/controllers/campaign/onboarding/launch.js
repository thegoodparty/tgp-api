// Admin endpoint

const { create } = require('lodash');
const slugify = require('slugify');
const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  friendlyName: 'Admin launch Campaign',

  inputs: {
    slug: {
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const inputSlug = inputs.slug;

      const campaignRecord = await Campaign.findOne({
        slug: inputSlug,
      });

      if (!campaignRecord) {
        console.log('no campaign');
        return exits.forbidden();
      }

      const campaign = campaignRecord.data;

      if (campaign.launchStatus === 'launched') {
        return exits.success({
          slug: campaign.candidateSlug || campaign.slug,
        });
      }

      const candidate = mapCampaignToCandidate(campaign);
      const { firstName, lastName, state } = candidate;
      const slug = await findSlug(candidate);
      candidate.slug = slug;
      const dbFields = {
        slug,
        firstName,
        lastName,
        isActive: true,
        state,
        contact: {},
        data: JSON.stringify(candidate),
      };

      const created = await Candidate.create(dbFields).fetch();
      await Candidate.updateOne({
        id: created.id,
      }).set({
        data: JSON.stringify({
          ...candidate,
          id: created.id,
        }),
      });

      await Campaign.updateOne({ slug: campaign.slug }).set({
        data: {
          ...campaign,
          launchStatus: 'launched',
          candidateSlug: slug,
        },
      });

      await Staff.create({
        role: 'owner',
        user: campaignRecord.user,
        candidate: created.id,
      });

      // console.log('cand', created);
      const { topIssues } = campaign.details;
      // topIssues;

      await createCandidatePositions(topIssues, created);

      await sails.helpers.crm.updateCandidate(created);
      await sails.helpers.cacheHelper('clear', 'all');

      await sendMail(slug);

      return exits.success({
        message: 'created',
        slug,
      });
    } catch (e) {
      console.log('Error at campaign launch', e);
      await sails.helpers.errorLoggerHelper('Error at campaign launch', e);
      return exits.forbidden();
    }
  },
};

function mapCampaignToCandidate(campaign) {
  if (!campaign) {
    return false;
  }
  const {
    slug,
    details,
    goals,
    campaignPlan,
    pathToVictory,
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
    customIssues,
    endorsements,
  } = campaign;

  const {
    firstName,
    lastName,
    party,
    state,
    office,
    pastExperience,
    occupation,
    funFact,
    district,
  } = details;
  const { slogan, aboutMe, why } = campaignPlan;

  const { electionDate } = goals;

  let voteGoal;
  let voterProjection;
  if (pathToVictory) {
    ({ voteGoal, voterProjection } = pathToVictory);
  }
  return {
    campaignOnboardingSlug: slug,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    party,
    district,
    state,
    office,
    slogan,
    about: aboutMe,
    why,
    pastExperience,
    occupation,
    funFact,
    voteGoal: parseInt(voteGoal) || 0,
    voterProjection: parseInt(voterProjection) || 0,
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
    isActive: true,
    electionDate,
    customIssues,
    endorsements,
  };
}

async function findSlug(candidate) {
  // trying first to use campaign slug
  const campaignExists = await Candidate.findOne({
    slug: candidate.campaignOnboardingSlug,
  });
  if (!campaignExists) {
    return candidate.campaignOnboardingSlug;
  }
  const { firstName, lastName } = candidate;
  const slug = slugify(`${firstName}-${lastName}`, { lower: true });
  const exists = await Candidate.findOne({ slug });
  if (!exists) {
    return slug;
  }
  for (let i = 1; i < 100; i++) {
    let slug = slugify(`${firstName}-${lastName}${i}`, { lower: true });
    let exists = await Candidate.findOne({ slug });
    if (!exists) {
      return slug;
    }
  }
  return slug; // should not happen
}

async function createCandidatePositions(topIssues, candidate) {
  for (let i = 0; i < topIssues.positions.length; i++) {
    const position = topIssues.positions[i];

    if (!position.topIssue) {
      continue;
    }
    await CandidatePosition.create({
      description: topIssues[`position-${position.id}`],
      candidate: candidate.id,
      position: position.id,
      topIssue: position.topIssue.id,
      order: i,
    });
    await Candidate.addToCollection(candidate.id, 'positions', position.id);
    await Candidate.addToCollection(
      candidate.id,
      'topIssues',
      position.topIssue.id,
    );
  }
}

//campagin-launch

async function sendMail(slug) {
  try {
    const campaign = await Campaign.findOne({ slug }).populate('user');
    const { user } = campaign;
    const variables = JSON.stringify({
      name: `${user.name}`,
      link: `${appBase}/${slug}`,
    });
    await sails.helpers.mailgun.mailgunTemplateSender(
      user.email,
      'Your Good Party Campaign is live!',
      'campagin-launch',
      variables,
    );
  } catch (e) {
    console.log(e);
  }
}

const t = {
  slug: 'terry-vo',
  details: {
    firstName: 'Terry',
    lastName: 'Vo',
    zip: '37210',
    dob: '1985-03-20',
    citizen: 'yes',
    party: 'Independent',
    otherParty: '',
    knowRun: 'yes',
    state: 'TN',
    office: 'Council member',
    district: 'District 17',
    articles: '',
    runBefore: 'no',
    officeRunBefore: '',
    pastExperience:
      "I moved to Nashville in 2009 to work for the Consulate-General of Japan. I shared Japanese culture and sent people to work, study, and do research in Japan within the jurisdiction of AR, KY, LA, MS, and TN. Under my leadership, I revitalized the Chestnut Hill Neighborhood Association (Trimble Action Group) and helped the Tennessee Pride Chamber go statewide. I co-founded API Middle Tennessee, a non-profit that works towards racial justice for the Asian Pacific Islander\ncommunity. I've work on the Urban Design Overlay that addressed density, neighborhood character, and improvements. I have been actively working in the neighborhood to create safe and welcoming spaces and build community. I am ready to take it from the neighborhood level to the District level.",
    occupation: 'Self-Employed',
    funFact:
      "I love gardening and grow sunflowers. I co-founded a book club, the Beautiful Bookworms over 6 years ago and it's thriving. I love domestic and international travel. I want to go to all 7 continents and have one left to visit. ",
  },
  currentStep: 'launch-11',
  hubspotId: '15875442603',
  goals: {
    filedStatement: 'yes',
    campaignCommittee: 'Friends of Terry Vo | Treasurer, Lindsey Harris',
    electionDate: '2023-08-03',
    runningAgainst: [
      {
        name: 'Teaka Jackson',
        description: 'Native Nashvillian Paralegal',
        party: 'Other',
      },
      {
        name: 'Tonya Esquibel',
        description: 'Lender',
        party: 'Republican Party',
      },
    ],
  },
  campaignPlanStatus: {
    slogan: 'completed',
    policyPlatform: 'completed',
    why: 'completed',
    communicationsStrategy: 'completed',
    messageBox: 'completed',
    aboutMe: 'completed',
    pathToVictory: 'completed',
    mobilizing: 'completed',
    operationalPlan: 'completed',
    timeline: 'completed',
  },
  campaignPlan: {
    communicationsStrategy:
      '<div class="p-4">\n  <h2 class="text-2xl font-bold mb-2">Communications Plan for Terry Vo\'s Council Member Campaign in District 17</h2>\n  \n  <h3 class="text-xl font-bold mt-4 mb-2">1. Situation Analysis</h3>\n  <p class="mb-4">Terry Vo is running for Council Member in District 17 against three opponents. The campaign needs to address key issues and challenges, such as building community, improving safety and welcoming spaces, and promoting racial justice for the Asian Pacific Islander community. The campaign also needs to assess the current political landscape and adapt to any changes in the local and national issues.</p>\n  \n  <h3 class="text-xl font-bold mb-2">2. Target Audience</h3>\n  <p class="mb-4">The target audiences are residents of District 17, particularly those who are Asian Pacific Islanders, live in Chestnut Hill Neighborhood, care about community building, safety and diversity, and are politically engaged. The best channels to reach them are social media, community events and public speaking opportunities, direct mail and phone calls, and earned media outreach via local ethnic media and neighborhood papers.</p>\n  \n  <h3 class="text-xl font-bold mb-2">3. Message Development</h3>\n  <p class="mb-4">The campaign\'s message is: "Building Community, Promoting Diversity, Ensuring Safety for All." This message resonates with the target audience because it addresses their concerns and interests. The campaign will craft clear, concise, and compelling messages that emphasize Terry Vo\'s leadership, experience, and vision for the district. The key issues and achievements will be highlighted in all aspects of the campaign.</p>\n\n  <h3 class="text-xl font-bold mb-2">4. Media Relations</h3>\n  <p class="mb-4">The campaign will build relationships with journalists and media outlets that cover local politics and ethnic communities. It will identify opportunities for media coverage and develop press releases, talking points, and other materials to support media outreach. The campaign will also invite media to attend and cover public events and rallies.</p>\n\n  <h3 class="text-xl font-bold mb-2">5. Digital Strategy</h3>\n  <p class="mb-4">The campaign\'s social media strategy will focus on engaging with supporters, reaching new audiences, and mobilizing volunteers. The campaign will create compelling digital content, such as videos, graphics, and blog posts, that showcase Terry Vo\'s personality, experience, and campaign goals. The campaign will also use online platforms, such as Facebook, Twitter, Instagram, and Nextdoor, to interact with residents, answer their questions and concerns, and promote the campaign\'s message.</p>\n\n  <h3 class="text-xl font-bold mb-2">6. Events and Rallies</h3>\n  <p class="mb-4">The campaign will organize public events, rallies, and other activities to generate enthusiasm for the campaign and mobilize supporters. The events will be held in safe and welcoming spaces, such as parks, community centers, and ethnic restaurants. They will showcase Terry Vo\'s commitment to community building, racial justice, and diversity. The events will also feature local artists, musicians, and food vendors to promote local economic development.</p>\n  \n  <h3 class="text-xl font-bold mb-2">7. Fundraising</h3>\n  <p class="mb-4">The campaign will develop a fundraising strategy that identifies fundraising goals, develops fundraising materials, and identifies potential donors and fundraising opportunities. The campaign will conduct online and offline fundraising activities, such as direct mail, phone calls, and house parties. The campaign will also seek endorsements from local organizations and elected officials, which can boost the campaign\'s visibility and credibility.</p>\n  \n  <h3 class="text-xl font-bold mb-2">About Terry Vo</h3>\n  <p class="mb-4">Terry Vo is a self-employed individual who loves gardening, book clubs, and international travel. Terry Vo is an experienced leader who has revitalized neighborhood associations, promoted racial justice for the Asian Pacific Islander community, and worked on urban design overlay issues. Terry Vo is running for Council Member in District 17 to take the vision and experience to the next level.</p>\n  \n  <h3 class="text-xl font-bold mb-2">About the Race</h3>\n  <p class="mb-4">Terry Vo is running for Council Member in District 17 against Teaka Jackson and Tonya Esquibel, both of whom have different party affiliations. The election date is August 3, 2023.</p>\n  \n</div>',
    messageBox:
      '<div class="grid grid-cols-2 grid-rows-2 gap-4">\n  <div class="bg-gray-200 p-4">\n    <h2 class="font-bold text-2xl mb-2">What I will say about myself</h2>\n    <p>Hi, I\'m Terry Vo and I\'m running for Council member in District 17 as an Independent. I have a strong background in community leadership and have worked hard to make the neighborhoods in our district safe and welcoming places. I love gardening, travel, and co-founded a thriving book club. As your council member, I will work tirelessly to represent our district and make it an even better place to live and work.</p>\n  </div>\n  <div class="bg-gray-200 p-4">\n    <h2 class="font-bold text-2xl mb-2">What I will say about my opponent</h2>\n    <p>I respect my opponent, Teaka Jackson, and appreciate their dedication to our district. However, I believe that my background in community leadership and my commitment to improving our district makes me the best choice for Council member in District 17. I look forward to a respectful and productive campaign season.</p>\n  </div>\n  <div class="bg-gray-200 p-4">\n    <h2 class="font-bold text-2xl mb-2">What my opponent will say about me</h2>\n    <p>I expect that my opponent, Teaka Jackson, will likely highlight that I am running as an Independent rather than with a major political party. They may also note that I am a relatively new resident of Nashville, having moved here in 2009. However, I believe that my experience and dedication to our district will speak for itself, regardless of such criticisms.</p>\n  </div>\n  <div class="bg-gray-200 p-4">\n    <h2 class="font-bold text-2xl mb-2">What my opponent will say about themselves</h2>\n    <p>I expect that my opponent, Tonya Esquibel, will likely highlight their background in lending and their commitment to conservative values. They may also note that they are a member of the Republican Party. However, ultimately the voters in our district will decide which candidate they believe will best serve their interests and values.</p>\n  </div>\n</div>',
    policyPlatform:
      '<div class="p-4">\n  <h1 class="text-2xl font-bold mb-2">Terry Vo\'s Policy Platform:</h1>\n  <h2 class="text-lg font-bold mb-1">1. Affordable Housing:</h2>\n  <ul class="list-disc ml-6 mb-2">\n    <li class="mb-1">Support initiatives for affordable housing development in District 17.</li>\n    <li class="mb-1">Work with community groups to provide housing assistance and education.</li>\n    <li class="mb-1">Promote policies that ensure access to safe and affordable housing for all.</li>\n  </ul>\n  <h2 class="text-lg font-bold mb-1">2. Public Safety:</h2>\n  <ul class="list-disc ml-6 mb-2">\n    <li class="mb-1">Collaborate with local law enforcement to address issues of crime and safety in the community.</li>\n    <li class="mb-1">Advocate for policies that promote community-driven public safety solutions.</li>\n    <li class="mb-1">Support funding for programs that promote conflict resolution and violence prevention.</li>\n  </ul>\n  <h2 class="text-lg font-bold mb-1">3. Environmental Protection:</h2>\n  <ul class="list-disc ml-6">\n    <li class="mb-1">Promote policies that reduce carbon emissions and protect the environment.</li>\n    <li class="mb-1">Support initiatives that promote clean energy and sustainable practices.</li>\n    <li class="mb-1">Collaborate with local organizations to address environmental justice issues in the community.</li>\n  </ul>\n</div>',
    slogan: '"Growth for all: Inclusive leadership for District 17!"',
    aboutMe:
      'My name is Terry Vo and I am a candidate for Council member in District 17 as an independent. I am a self-employed individual who has a passion for gardening and growing sunflowers. Additionally, I am the co-founder of a book club, the Beautiful Bookworms, which has been thriving for over 6 years. I love to travel both domestically and internationally with a goal to visit all 7 continents. I moved to Nashville in 2009 to work for the Consulate-General of Japan where I shared the Japanese culture and helped people work, study, and do research. I have been involved in revitalizing the Chestnut Hill Neighborhood Association and helping the Tennessee Pride Chamber go statewide. I co-founded API Middle Tennessee, a non-profit that works towards racial justice for the Asian Pacific Islander community. I have worked on the Urban Design Overlay that addressed density, neighborhood character, and improvements. I am ready to take what I have learned from working in the neighborhood and apply it to the district level. Unknown and underserved populations matter to me, and I am committed to bringing voices that have been neglected to the forefront.',
    why: "I'm Terry Vo, and I'm running for Metro Council in District 17. As someone who has lived and worked in Nashville for over 10 years, I'm passionate about making our community a better place for everyone. I have helped with revitalizing neighborhoods, working towards racial justice, and advocating for safe and welcoming spaces. I have experience in the private, non-profit, and government sectors that span three continents. I care about safety, affordability, and inclusive growth. I believe that everyone in our community deserves a voice. As a Council member, I will work hard to ensure that all voices are heard and that our community is a place where everyone can thrive.",
    mobilizing:
      '<div class="bg-gray-100 p-4">\n  <h3 class="text-lg font-bold mb-2">Field Plan for Terry Vo</h3>\n  \n  <!-- Voter Targeting -->\n  <div class="mb-4">\n    <h4 class="font-bold text-gray-700 mb-2">Voter Targeting</h4>\n    <p class="mb-2">Terry Vo\'s base voters are likely to be Independent voters, as they make up the majority of registered voters in the district. The group of voters most likely to be persuaded to support Terry Vo are Democrats, as they tend to align with more progressive and community-oriented candidates. The voters most likely to support Terry Vo\'s opponents are Republicans, who may be attracted to Teaka Jackson\'s native Nashvillian status or Tonya Esquibel\'s financial background.</p>\n    <p class="mb-2">Messages should focus on community building, supporting local businesses, and improving quality of life for all residents regardless of political affiliation. Demographics to focus outreach on include individuals aged 18-45, as they are more likely to be active in social and political causes, and women, as they oftentimes play a key role in household decision-making.</p>\n  </div>\n  \n  <!-- Canvassing Strategy -->\n  <div class="mb-4">\n    <h4 class="font-bold text-gray-700 mb-2">Canvassing Strategy</h4>\n    <p class="mb-2">Working backwards from election day, Terry Vo\'s campaign should aim to complete at least 10,000 door knocks per week. This would require a minimum of 100 volunteers each week, with each volunteer committing to at least one 4-hour shift. The campaign should provide volunteers with clear scripts and literature outlining Terry Vo\'s platform, as well as training on how to effectively engage with voters in the district.</p>\n  </div>\n  \n  <!-- Phone Banking -->\n  <div class="mb-4">\n    <h4 class="font-bold text-gray-700 mb-2">Phone Banking</h4>\n    <p class="mb-2">Working backwards from election day, Terry Vo\'s campaign should aim to complete at least 2,000 phone calls per week. This would require a minimum of 50 volunteers each week, with each volunteer committing to at least one 4-hour shift. The campaign should provide volunteers with clear scripts and training on how to effectively communicate Terry Vo\'s message over the phone.</p>\n  </div>\n  \n  <!-- Voter Registration -->\n  <div class="mb-4">\n    <h4 class="font-bold text-gray-700 mb-2">Voter Registration</h4>\n    <p class="mb-2">Terry Vo\'s campaign should prioritize voter registration efforts in areas with high numbers of unregistered voters, particularly in zip code 37210. The campaign should identify potential voters who are not registered to vote and provide them with information about the registration process and deadlines. The campaign should also host voter registration drives and partner with local organizations to increase registration rates.</p>\n  </div>\n  \n  <!-- Get-Out-The-Vote (GOTV) -->\n  <div class="mb-4">\n    <h4 class="font-bold text-gray-700 mb-2">Get-Out-The-Vote (GOTV)</h4>\n    <p class="mb-2">Terry Vo\'s campaign should develop a comprehensive GOTV plan that includes reminders for supporters to vote, information about polling locations and hours, and transportation to the polls if necessary. The campaign should also prioritize outreach to voters who are likely to support Terry Vo but may not have voted in previous elections. The goal should be to increase supportive voter turnout by at least 2% to 5%.</p>\n  </div>\n  \n  <!-- Data Management -->\n  <div class="mb-4">\n    <h4 class="font-bold text-gray-700 mb-2">Data Management</h4>\n    <p class="mb-2">Terry Vo\'s campaign should invest in a robust data management system, such as a CRM, to track voter contact information, canvassing results, and other relevant data. This will allow the campaign to target its efforts more effectively and make data-driven decisions as the election approaches.</p>\n  </div>\n  \n  <!-- Overall -->\n  <div>\n    <h4 class="font-bold text-gray-700 mb-2">Overall</h4>\n    <p class="mb-2">Terry Vo\'s field plan should be comprehensive and integrated, with each element working together to achieve the campaign\'s goals. It should also be flexible enough to adapt to changing circumstances, such as unexpected events or shifts in the political landscape.</p>\n  </div>\n  \n</div>',
    operationalPlan:
      "<div>\n  <h2>12-Month Budget Plan for Political Candidate</h2>\n  \n  <h3>Objective</h3>\n  <p>The candidate's win number is 929. Based on this number, the target budget is $4,645 for each vote, which amounts to $4,316,605 in total. This plan should include fundraising, campaign spending (staffing and overhead, voter contact), and adhere to specific constraints.</p>\n  \n  <h3>Constraints</h3>\n  <ul>\n    <li>Proportion of spending on staffing and overhead: 40% staffing, 60% overhead</li>\n    <li>Cumulative campaign spending limit: $4,316,605</li>\n  </ul>\n  \n  <h3>Budget Plan</h3>\n  <table>\n    <thead>\n      <tr>\n        <th>Month</th>\n        <th>Fundraising</th>\n        <th>Staffing</th>\n        <th>Overhead</th>\n        <th>Direct Mail Advertising</th>\n        <th>Pamphlets and Literature</th>\n        <th>Digital Advertising</th>\n        <th>Lawn Signs</th>\n        <th>Radio/Podcast Ads</th>\n        <th>TV Ads</th>\n        <th>Robo Calls</th>\n        <th>SMS</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td>January</td>\n        <td>$300,000</td>\n        <td>$70,000</td>\n        <td>$105,000</td>\n        <td>$2,500</td>\n        <td>$2,500</td>\n        <td>$10,000</td>\n        <td>$3,000</td>\n        <td>$0</td>\n        <td>$0</td>\n        <td>$0</td>\n        <td>$0</td>\n      </tr>\n      <tr>\n        <td>February</td>\n        <td>$300,000</td>\n        <td>$70,000</td>\n        <td>$105,000</td>\n        <td>$2,500</td>\n        <td>$2,500</td>\n        <td>$10,000</td>\n        <td>$3,000</td>\n        <td>$0</td>\n        <td>$0</td>\n        <td>$0</td>\n        <td>$0</td>\n      </tr>\n      <tr>\n        <td>March</td>\n        <td>$350,000</td>\n        <td>$70,000</td>\n        <td>$105,000</td>\n        <td>$2,500</td>\n        <td>$2,500</td>\n        <td>$10,000</td>\n        <td>$3,000</td>\n        <td>$2,500</td>\n        <td>$0</td>\n        <td>$0</td>\n        <td>$0</td>\n      </tr>\n      <tr>\n        <td>April</td>\n        <td>$350,000</td>\n        <td>$87,500</td>\n        <td>$131,250</td>\n        <td>$2,500</td>\n        <td>$2,500</td>\n        <td>$10,000</td>\n        <td>$3,000</td>\n        <td>$2,500</td>\n        <td>$0</td>\n        <td>$0</td>\n        <td>$0</td>\n      </tr>\n      <tr>\n        <td>May</td>\n        <td>$400,000</td>\n        <td>$87,500</td>\n        <td>$131,250</td>\n        <td>$2,500</td>\n        <td>$2,500</td>\n        <td>$10,000</td>\n        <td>$3,000</td>\n        <td>$5,000</td>\n        <td>$0</td>\n        <td>$0</td>\n        <td>$0</td>\n      </tr>\n      <tr>\n        <td>June</td>\n        <td>$400,000</td>\n        <td>$87,500</td>\n        <td>$131,250</td>\n        <td>$2,500</td>\n        <td>$2,500</td>\n        <td>$10,000</td>\n        <td>$3,000</td>\n        <td>$5,000</td>\n        <td>$0</td>\n        <td>$0</td>\n        <td>$0</td>\n      </tr>\n      <tr>\n        <td>July</td>\n        <td>$450,000</td>\n        <td>$87,500</td>\n        <td>$131,250</td>\n        <td>$5,000</td>\n        <td>$5,000</td>\n        <td>$20,000</td>\n        <td>$3,000</td>\n        <td>$7,500</td>\n        <td>$0</td>\n        <td>$0</td>\n        <td>$0</td>\n      </tr>\n      <tr>\n        <td>August</td>\n        <td>$450,000</td>\n        <td>$105,000</td>\n        <td>$157,500</td>\n        <td>$5,000</td>\n        <td>$5,000</td>\n        <td>$20,000</td>\n        <td>$3,000</td>\n        <td>$7,500</td>\n        <td>$1,000,000</td>\n        <td>$250,000</td>\n        <td>$0</td>\n      </tr>\n    </tbody>\n    <tfoot>\n      <tr>\n        <td>Total</td>\n        <td>$3,000,000</td>\n        <td>$732,500</td>\n        <td>$1,098,750</td>\n        <td>$25,000</td>\n        <td>$25,000</td>\n        <td>$100,000</td>\n        <td>$18,000</td>\n        <td>$20,000</td>\n        <td>$1,000,000</td>\n        <td>$250,000</td>\n        <td>$0</td>\n      </tr>\n    </tfoot>\n  </table>\n  \n  <h3>Hiring Plan</h3>\n  <table>\n    <thead>\n      <tr>\n        <th>Name</th>\n        <th>Role</th>\n        <th>Start Date</th>\n        <th>Salary</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td>John Doe</td>\n        <td>Campaign Manager</td>\n        <td>January 1, 2023</td>\n        <td>$8,000</td>\n      </tr>\n      <tr>\n        <td>Jane Smith</td>\n        <td>Communications Director</td>\n        <td>January 1, 2023</td>\n        <td>$6,000</td>\n      </tr>\n      <tr>\n        <td>Mike Johnson</td>\n        <td>Field Director</td>\n        <td>January 15, 2023</td>\n        <td>$5,000</td>\n      </tr>\n      <tr>\n        <td>Susan Lee</td>\n        <td>Data Director</td>\n        <td>February 1, 2023</td>\n        <td>$5,000</td>\n      </tr>\n      <tr>\n        <td>Tom Williams</td>\n        <td>Fundraising Director</td>\n        <td>February 1, 2023</td>\n        <td>$5,000</td>\n      </tr>\n      <tr>\n        <td>Emily Brown</td>\n        <td>Volunteer Coordinator</td>\n        <td>March 1, 2023</td>\n        <td>$3,000</td>\n      </tr>\n      <tr>\n        <td>David Davis</td>\n        <td>Policy Director</td>\n        <td>April 1, 2023</td>\n        <td>$4,000</td>\n      </tr>\n      <tr>\n        <td>Sarah Garcia</td>\n        <td>Finance Director</td>\n        <td>May 1, 2023</td>\n        <td>$5,000</td>\n      </tr>\n      <tr>\n        <td>Martin Rivera</td>\n        <td>Outreach Coordinator</td>\n        <td>June 1, 2023</td>\n        <td>$3,000</td>\n      </tr>\n    </tbody>\n  </table>\n  \n  <h3>Staffing and Overhead Breakdown</h3>\n  <table>\n    <thead>\n      <tr>\n        <th>Role</th>\n        <th>January</th>\n        <th>February</th>\n        <th>March</th>\n        <th>April</th>\n        <th>May</th>\n        <th>June</th>\n        <th>July</th>\n        <th>August</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td>Campaign Manager</td>\n        <td>$8,000</td>\n        <td>$8,000</td>\n        <td>$8,000</td>\n        <td>$8,750</td>\n        <td>$8,750</td>\n        <td>$8,750</td>\n        <td>$8,750</td>\n        <td>$8,750</td>\n      </tr>\n      <tr>\n        <td>Communications Director</td>\n        <td>$6,000</td>\n        <td>$6,000</td>\n        <td>$6,000</td>\n        <td>$6,563</td>\n        <td>$6,563</td>\n        <td>$6,563</td>\n        <td>$6,563</td>\n        <td>$6,563</td>\n      </tr>\n      <tr>\n        <td>Field Director</td>\n        <td>$5,250</td>\n        <td>$5,250</td>\n        <td>$5,250</td>\n        <td>$5,738</td>\n        <td>$5,738</td>\n        <td>$5,738</td>\n        <td>$5,738</td>\n        <td>$5,738</td>\n      </tr>\n      <tr>\n        <td>Data Director</td>\n        <td>$5,250</td>\n        <td>$5,250</td>\n        <td>$5,250</td>\n        <td>$5,738</td>\n        <td>$5,738</td>\n        <td>$5,738</td>\n        <td>$5,738</td>\n        <td>$5,738</td>\n      </tr>\n      <tr>\n        <td>Fundraising Director</td>\n        <td>$5,250</td>\n        <td>$5,250</td>\n        <td>$5,250</td>\n        <td>$5,738</td>\n       ",
    pathToVictory:
      '<div class="p-4">\n    <p><strong>Total Votes Secured / Win Number:</strong> 929 / 1821</p>\n    <p>To achieve the win number of 929 votes, Terry Vo needs to focus on securing votes from Independents, Democrats, and even some Republicans. With 6593 registered Independents, Terry Vo should aim to secure at least 450 votes from this group. For Democrats, with 3988 registered voters, Terry Vo should aim to secure at least 400 votes from this group. For Republicans, with 1057 registered voters in the race, Terry Vo should aim to secure at least 80 votes from this group.</p>\n    <p>To secure votes from Independents, Terry Vo should aim to attend community events, organize meet-and-greet events, and focus on messaging that appeals to the independent-minded voters. Terry Vo can leverage their past experience in revitalizing neighborhoods and building a strong community to convey that they can provide effective leadership at the District level.</p>\n    <p>To secure votes from Democrats, Terry Vo should focus on messaging that resonates with the values of the Democratic Party including social justice, equality, and community-driven initiatives. Terry Vo can communicate their work with API Middle Tennessee and their commitment to racial justice and equity.</p>\n    <p>To secure votes from Republicans, Terry Vo can focus on messaging that emphasizes their experience as a successful self-employed individual and how they can bring a business mindset to the Council. Terry Vo can communicate their commitment to fiscal responsibility and efficient use of taxpayer money, which might appeal to some Republican voters.</p>\n    <p>In summary, Terry Vo needs to secure 450 Independent votes, 400 Democrat votes, and 80 Republican votes to achieve the win number of 929 votes. They can achieve this by attending community events, organizing meet-and-greet events, and messaging that appeals to each group of voters.</p>\n</div>',
    timeline:
      '<div class="bg-gray-100 py-4 px-6">\n    <h2 class="text-2xl font-bold mb-4">Campaign Plan Timeline for Terry Vo</h2>\n    <h3 class="text-xl font-bold mb-2">Election Day: August 3, 2023</h3>\n    <ul class="list-disc ml-6 mb-8">\n        <li>Get Out the Vote: July 3, 2023 - July 30, 2023</li>\n        <li>Early Voting: July 14, 2023 - July 29, 2023</li>\n        <li>Voter Registration Deadline: July 3, 2023</li>\n    </ul>\n    <h3 class="text-xl font-bold mb-2">Launch Date: May 4, 2023 (12 weeks prior to election day)</h3>\n    <ul class="list-disc ml-6 mb-8">\n        <li>Create Campaign Website: May 4, 2023 - May 18, 2023</li>\n        <li>Launch Social Media Campaign: May 5, 2023</li>\n        <li>Plan Fundraiser Event: May 6, 2023 - June 16, 2023</li>\n        <li>Develop Voter Contact Plan: May 18, 2023 - June 1, 2023</li>\n        <li>Contact Local News Outlets for Interviews: May 18, 2023 - July 30, 2023</li>\n        <li>Plan Voter Outreach Events: May 18, 2023 - August 2, 2023</li>\n    </ul>\n    <h3 class="text-xl font-bold mb-2">Relevant Holidays</h3>\n    <ul class="list-disc ml-6 mb-8">\n        <li>Memorial Day: May 30, 2023</li>\n        <li>Independence Day: July 4, 2023</li>\n    </ul>\n    <h3 class="text-xl font-bold mb-2">Get Out the Vote Phase</h3>\n    <ul class="list-disc ml-6 mb-8">\n        <li>Phone Bank: July 3, 2023 - July 30, 2023</li>\n        <li>Door Knocking: July 7, 2023 - July 30, 2023</li>\n        <li>Host Voter Outreach Events: July 10, 2023 - August 2, 2023</li>\n        <li>Send Text Reminders: July 15, 2023 - July 30, 2023</li>\n    </ul>\n    <h3 class="text-xl font-bold mb-2">Voter Contact Goals</h3>\n    <ul class="list-disc ml-6 mb-8">\n        <li>Contact Every Independent Voter: May 18, 2023 - July 30, 2023</li>\n        <li>Send Follow-Up Emails to Independent Voters: July 31, 2023 - August 2, 2023</li>\n    </ul>\n</div>',
  },
  pathToVictory: {
    totalRegisteredVoters: '11638',
    projectedTurnout: '1821',
    winNumber: 929,
    republicans: '1057',
    democrats: '3988',
    indies: '6593',
    averageTurnout: '16',
    allAvailVoters: '7524',
    availVotersTo35: '3920',
    women: '2496',
    men: '5139',
    africanAmerican: 0,
    white: 0,
    asian: 0,
    hispanic: 0,
    voteGoal: '965',
    voterProjection: '647',
    budgetLow: 0,
    budgetHigh: '24133',
  },
  image:
    'https://assets.goodparty.org/candidate-info/9577f955-7bfd-44ca-8e18-c3137a0ebc24.jpg',
  lastStepDate: '2023-06-27',
  profile: { completed: true },
  customIssues: [
    {
      title: 'Safety',
      position:
        'The safest neighborhoods are the ones where neighbors know each other. We need to encourage civic participation through impactful neighborhood and community events that provide resources to bolster our neighborhood associations. These measures will allow residents to mold the future of their communities, whether it be through enhanced walkability or beautification initiatives.',
      order: 1,
    },
    {
      title: 'Affordability',
      position:
        'What does the future of housing look like? Equitable, human-centric, and accessible. In order to get out of Nashville’s affordability crisis, we need to review how we look at property taxes and ensure that people from all backgrounds can become homeowners through affordable pricing. Additionally, parameters must be set around rent control to encourage mobility, access, and growth. We need to be able to anticipate future housing trends and work off of those to ensure that we are consciously building with future generations in mind.\n',
      order: 1,
    },
    {
      title: 'Inclusive Growth',
      position:
        'Clear communication channels need to be made available between residents and developers to ensure that future growth is benefitting the neighborhood and city overall. Peoples’ voices need to be heard and engagement needs to be encouraged, which can be achieved through accessibility and transparency. Additionally, I strive to keep the development of our city multifaceted, particularly through supporting small, local businesses from diverse backgrounds.',
      order: 1,
    },
  ],
  endorsements: [
    {
      name: 'Planned Parenthood',
      image:
        'https://assets.goodparty.org/candidate-info/a06a1d31-8af9-4aee-bb25-7e2e7278510f.png',
      content:
        'Tennessee Advocates for Planned Parenthood is proud endorse Terry Vo for Nashville City Council District 17. Her leadership qualities and support of our values meet Planned Parenthood’s high standards. TAPP supports candidates who are aligned with our issue priorities: Safe, legal abortion. Health care access. Sex education. Build Strong, Healthy Communities.',
    },
    {
      name: 'Women in Numbers',
      image:
        'https://assets.goodparty.org/candidate-info/8bbfdd10-774f-45ff-8781-606c98f36846.png',
      content:
        'Women in Numbers is delighted to endorse Terry Vo for Metro Council District 17!\n',
    },
    {
      name: 'Colby Sledge, District 17 Council Member',
      image:
        'https://assets.goodparty.org/candidate-info/06783b37-fd8b-4ac7-aaae-38138154ff8d.jpg',
      content:
        "Our next District 17 Councilmember will matter a lot in serving our thriving, vibrant communities. That's why I'm endorsing Terry Vo to be your next District 17 Councilmember. She's friendly, hardworking, and wants to help.",
    },
    {
      name: 'Ashley C., Chestnut Hill Resident',
      image:
        'https://assets.goodparty.org/candidate-info/22aa8728-5dee-4a64-9544-3d0c6d333101.jpg',
      content:
        "Terry Vo has been an effective leader in the Chestnut Hill community. She believes in diversity and inclusion and will make ensure that your voice is heard. That's why I am going to Vote Vo \nas our next District 17 Councilmember!",
    },
    {
      name: 'Todd Evans, Diskin Cider Co-Founder',
      image:
        'https://assets.goodparty.org/candidate-info/bf9d6bd1-d545-49cb-a449-1faca1c26ec2.jpeg',
      content:
        "As a Nashville native & Wedgewood Houston business owner, I want a Councilmember who has proven to be a collaborative leader, supports local businesses, & cares about keeping the District welcoming & diverse. I've known Terry for several years. She has supported Diskin Cider from the beginning and was instrumental with helping us form a partnership with the TN Pride Chamber that continues today.",
    },
    {
      name: 'Vidalia Anne Gentry, Founder, Glitz Presents & SiSSi',
      image:
        'https://assets.goodparty.org/candidate-info/e294c1dc-2646-4574-8826-cb2688cf90aa.jpg',
      content:
        "Right now, more than ever, we need Metro Councilmembers who not only listen but will wholeheartedly champion the needs of the vibrant Nashville Queer community. Terry and I, both nominees for TN Pride Chamber 2023 Advocate of the Year, understand the importance of creating an inclusive and supportive environment for the LGBTQIA+ community. That's why I want you to join me and #VoteVo.",
    },
  ],
  team: { completed: true },
  social: { completed: true },
  finance: { ein: true, management: true, regulatory: true, filing: true },
  launch: {
    'website-0': true,
    'website-1': true,
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
  candidateSlug: 'terry-vo',
};
