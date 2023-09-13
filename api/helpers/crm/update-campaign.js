// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');

const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;

module.exports = {
  inputs: {
    campaign: {
      type: 'json',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    try {
      if (!hubSpotToken) {
        // for non production env.
        return exits.success('no api key');
      }
      const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });

      const { campaign } = inputs;
      // console.log('campaign', campaign);
      const { data } = campaign;
      const { launchStatus, lastStepDate } = data;
      const dataDetails = campaign?.data?.details;
      const currentStep = campaign?.data?.currentStep || '';

      const profileCompleted =
        data?.profile &&
        (data.profile.completed || data.profilecampaignWebsite);
      // console.log('dataDetails', dataDetails);
      // console.log('lastStepDate', lastStepDate);
      const { zip, firstName, lastName, party, office, state, pledged, goals } =
        dataDetails;
      const longState = state
        ? await sails.helpers.zip.shortToLongState(state)
        : undefined;
      const companyObj = {
        properties: {
          name: `${firstName} ${lastName}`,
          candidate_name: `${firstName} ${lastName}`,
          candidate_party: party,
          candidate_office: office,
          state: longState,
          lifecyclestage: 'customer',
          type: 'CANDIDATE',
          last_step: currentStep,
          last_step_date: lastStepDate || undefined,
          zip,
          pledge_status: pledged ? 'yes' : 'no',
          is_active: !!details?.firstName,
          live_candidate: launchStatus === 'launched',
          // todo: this will need to be reworked if/when we add in Rob/Colton
          unlock_expert: profileCompleted ? 'Jared' : '',
          unlock_jared: profileCompleted ? 'Yes' : 'No',
          p2v_complete_date: data?.p2vCompleteDate || undefined,
          p2v_status: data?.p2vStatus || 'Locked',
        },
      };

      const existingId = data.hubspotId;
      if (existingId) {
        // console.log('updating existing company in hubspot', existingId);
        await hubspotClient.crm.companies.basicApi.update(
          existingId,
          companyObj,
        );

        const userId = campaign.user;
        const user = await User.findOne({ id: userId });
        await sails.helpers.crm.updateUser(user);

        // console.log('apiResp', apiResp);
        return exits.success(existingId);
      } else {
        // update user record with the id from the crm
        // console.log('creating new company in hubspot');
        const createCompanyResponse =
          await hubspotClient.crm.companies.basicApi.create(companyObj);

        const userId = campaign.user;
        // console.log('userId', userId);
        const user = await User.findOne({ id: userId });
        const hubspotId = createCompanyResponse.id;
        data.hubspotId = hubspotId;
        await Campaign.updateOne({ id: campaign.id }).set({
          data,
        });
        // make sure we refresh campaign object so we have hubspotId.
        const campaignObj = await Campaign.findOne({ id: campaign.id });

        // associate the Contact with the Company in Hubspot
        // console.log('associating user with company in hubspot');
        try {
          await sails.helpers.crm.associateUserCampaign(
            user,
            campaignObj,
            false,
          );
        } catch (e) {
          console.log('error updating crm', e);
          await sails.helpers.errorLoggerHelper('Error updating hubspot', e);
        }
        // console.log('apiResp', apiResp);
        await sails.helpers.crm.updateUser(user);
        return exits.success(hubspotId);
      }
    } catch (e) {
      console.log('hubspot error - update-campaign', e);
      await sails.helpers.errorLoggerHelper(
        'Error updating hubspot- update-campaign',
        e,
      );
      return exits.success('not ok');
    }
  },
};

const c = {
  slug: 'amy-dragotta',
  lastVisited: 1694580532290,
  details: {
    firstName: 'Amy',
    lastName: 'Dragotta',
    campaignPhone: '9194643376',
    zip: '27501',
    dob: '1981-11-11',
    citizen: 'yes',
    filedStatement: 'yes',
    campaignCommittee: 'Amy Dragotta for Mayor',
    party: 'Independent',
    otherParty: '',
    knowRun: 'yes',
    state: 'NC',
    office: 'Mayor',
    officeTermLength: '4 years',
    otherOffice: '',
    district: '',
    city: 'Angier',
    articles: '',
    runBefore: 'no',
    officeRunBefore: '',
    pastExperience:
      'I have served as both a long term missionary as well as attended many short term trips in a variety of places both near and far. A few examples: framed houses with Habitat for Humanity both locally and in a warehouse in Pittsburgh, did house repair on short term trips in rural  Kentucky and urban Birmingham, went to a remote village in Africa with a team of women to bring hope in the form of water by helping to dig a well for the village, and worked for Methodist Habitat doing hurricane relief in the Bahamas and building churches in rural Mexico. These experiences helped build an innate sense of compassion for all people despite our differences. I also gained a confidence in talking to people I didn’t know and in front of people about various topics. I also got to see the world and learn about other cultures, which has helped me shape my vision for life on a much bigger scale. \n\nI’ve also been a volunteer in local community organizations for many years including women’s prison ministry, food and clothing ministries, and served as a youth leader for many years. \n\nI’ve been a Special Ed teacher since 2008. This has taught me so many valuable skills that will transfer over to my job as Mayor including collaborating with many different types of people, patience for hard situations, extensive practice in listening and communicating, and the ability to think outside of the box. \n\nI’m also a mom to three kids, and finished my masters degree in Education with a 3.8 GPA! ',
    occupation: 'Special Education Teacher ',
    funFact:
      'I love to sing karaoke and I love adventure! I’ve been cave diving, parasailing, open water snorkeling, and so much more! Whether I’m on the stage singing my heart out or pumping adrenaline from a daring activity, I have a zeal for life and bring a high level of enthusiasm to everything I do. ',
    topIssues: {
      'position-188':
        'Public schools in Harnett County are severely underfunded. I’m interested in how our town can better support our local schools while our county hopefully finds ways to better support financially. ',
      positions: [
        {
          createdAt: 1684772236797,
          updatedAt: 1684772236797,
          id: 188,
          name: 'Invest in local public education',
          topIssue: {
            createdAt: 1649219354758,
            updatedAt: 1649219354758,
            id: 21,
            name: 'Education',
          },
        },
        {
          createdAt: 1684771180559,
          updatedAt: 1684771180559,
          id: 177,
          name: 'Invest in infrastructure, create jobs',
          topIssue: {
            createdAt: 1684771117763,
            updatedAt: 1684771117763,
            id: 30,
            name: 'Economic Development',
          },
        },
        {
          createdAt: 1684772396089,
          updatedAt: 1684772396089,
          id: 197,
          name: 'Investing in park maintenance and improvement',
          topIssue: {
            createdAt: 1684772386126,
            updatedAt: 1684772386126,
            id: 32,
            name: 'Parks and Rec',
          },
        },
      ],
      'position-177':
        'Our town is playing catch up with the amount of population growth that we’ve had in the last few years. Supporting infrastructure projects is very important for us at this time. ',
      'position-197':
        'Our parks and recreation program is wonderful for our community but they are busting at the seams. They are past due for an upgrade and a community center. ',
    },
    pledged: true,
  },
  currentStep: 'profile-completed',
  lastStepDate: '2023-09-11',
  hubspotId: '17282507876',
  campaignPlanStatus: {
    policyPlatform: 'processing',
    slogan: 'completed',
    aboutMe: 'completed',
    why: 'completed',
    pathToVictory: 'completed',
    mobilizing: 'completed',
    messageBox: 'completed',
  },
  campaignPlan: {
    aboutMe:
      "I am a Special Education Teacher and a passionate advocate for adventure and life's experiences. I bring a high level of enthusiasm to everything I do, whether it's singing karaoke or engaging in daring activities like cave diving and parasailing. My past experiences as a missionary and volunteer in various organizations have instilled in me a sense of compassion for all people and a desire to make a positive impact in the world. As a Special Ed teacher, I have honed valuable skills such as collaboration, patience, and effective communication, which I believe will transfer seamlessly to my role as Mayor. As a mother of three and a dedicated student, I understand the importance of investing in education and infrastructure to support our growing population. I am committed to improving our local schools, investing in infrastructure projects to promote job creation, and enhancing our parks and recreation facilities for our community. Together, we can build a brighter future for our town.",
    why: 'I am running for office as a member of the Independent party because I believe that my experiences, skills, and passion for making a difference in the lives of others make me the ideal candidate. As a Special Education Teacher, I have learned the importance of collaboration, patience, listening, and thinking outside of the box, all of which are valuable assets for a Mayor. Additionally, my extensive volunteer work and missionary experiences have instilled in me a deep sense of compassion for all people, as well as the ability to connect with and communicate effectively with individuals from diverse backgrounds. Furthermore, being a mother of three and obtaining my masters degree while maintaining a high GPA has exemplified my commitment to education and personal growth. I am dedicated to investing in local public education, improving infrastructure to create jobs, and maintaining and enhancing our parks and recreation program. Together, we can make our community thrive and provide opportunities for everyone to enjoy a high quality of life.',
    slogan:
      '<p>Driven by Faith and Integrity, fueled by community. </p><p><br></p>',
    communicationsStrategy:
      '<div class="p-6 bg-white">\n  <h1 class="text-2xl font-bold mb-4">Communications Plan for Amy Dragotta\'s Mayoral Campaign</h1>\n\n  <h2 class="text-lg font-semibold">1. Situation Analysis</h2>\n  <p>As a candidate running for Mayor, Amy Dragotta needs to assess the current political landscape in order to identify the key issues and challenges that her campaign needs to address. This includes analyzing the underfunded state of local public education, the need for infrastructure development to support the growing population, and the importance of investing in park maintenance and improvement.</p>\n\n  <h2 class="text-lg font-semibold">2. Target Audience</h2>\n  <p>The target audience for Amy Dragotta\'s campaign consists of the residents of the town. This includes individuals of various demographics who are interested in supporting local public schools, creating job opportunities, and enhancing community parks. The campaign will use channels such as community events, local media outlets, and social media platforms to reach and engage with the target audience.</p>\n\n  <h2 class="text-lg font-semibold">3. Message Development</h2>\n  <p>The campaign\'s message will be centered around addressing the issues that are most important to the target audience. Amy Dragotta will emphasize her passion for improving local public education, investing in infrastructure to create jobs, and the need for park maintenance and improvement. The message will be clear, concise, and compelling to resonate with the audience.</p>\n\n  <h2 class="text-lg font-semibold">4. Media Relations</h2>\n  <p>The campaign will focus on building relationships with journalists and media outlets to secure media coverage that highlights Amy Dragotta\'s campaign and her proposed solutions to the town\'s challenges. Press releases, talking points, and other materials will be developed to support media outreach and effectively communicate the campaign\'s key messages.</p>\n\n  <h2 class="text-lg font-semibold">5. Digital Strategy</h2>\n  <p>A robust social media strategy will be developed to engage with supporters, reach new audiences, and mobilize volunteers. Compelling digital content, including videos, graphics, and testimonials, will be created and shared across online platforms to amplify Amy Dragotta\'s message and generate positive online buzz for the campaign.</p>\n\n  <h2 class="text-lg font-semibold">6. Events and Rallies</h2>\n  <p>The campaign will organize public events, rallies, and other activities to generate enthusiasm and support for Amy Dragotta\'s candidacy. These events will provide opportunities for direct interaction with the community, allowing Amy Dragotta to connect with voters, listen to their concerns, and showcase her vision for the town.</p>\n\n  <h2 class="text-lg font-semibold">7. Fundraising</h2>\n  <p>A comprehensive fundraising strategy will be developed to support the campaign\'s financial needs. This includes setting fundraising goals, creating compelling fundraising materials, and identifying potential donors and opportunities for fundraising events. The campaign will actively engage with the community to secure the necessary resources for a successful election.</p>\n</div>',
    messageBox:
      '<div class="grid grid-cols-2 gap-4">\n  <div class="bg-gray-200 p-4">\n    <h2 class="mb-2 text-xl font-bold">What I Will Say About Myself</h2>\n    <p>The candidate, Amy Dragotta, is a passionate and enthusiastic individual who brings a high level of energy to everything she does. With a background as a Special Education Teacher, Amy has developed valuable skills in collaboration, communication, and thinking outside of the box. She has also been actively involved in community organizations and has a strong sense of compassion for all people. As a mother of three and a dedicated student, Amy knows the importance of education and is committed to investing in local public schools. She is also focused on infrastructure development, job creation, and improving park maintenance to benefit the community.</p>\n    <p class="mt-4"><strong>Campaign Priorities:</strong></p>\n    <ul class="list-disc ml-8">\n      <li>Invest in local public education - Education</li>\n      <li>Invest in infrastructure, create jobs - Economic Development</li>\n      <li>Investing in park maintenance and improvement - Parks and Rec</li>\n    </ul>\n  </div>\n  <div class="bg-gray-200 p-4">\n    <h2 class="mb-2 text-xl font-bold">What I Will Say About My Opponent</h2>\n    <p>Amy Dragotta\'s opponent, Brian Hawley, is a politician affiliated with the Republican Party. He is married to a commissioner who currently holds office. While it is important to acknowledge his political experience, it is essential to critically evaluate the potential conflicts of interest that may arise from his familial connection within the local government.</p>\n  </div>\n  <div class="bg-gray-200 p-4">\n    <h2 class="mb-2 text-xl font-bold">What My Opponent Will Say About Me</h2>\n    <p>Amy Dragotta\'s opponent may claim that her background as a Special Education Teacher does not adequately prepare her for the role of Mayor. They may question her experience in political matters and attempt to undermine her qualifications based on their perception of her lack of expertise in governance. However, it is important to recognize that being a Special Education Teacher has provided Amy with valuable skills in collaboration, communication, and problem-solving that are highly transferrable to the position of Mayor.</p>\n    <p class="mt-4"><strong>Opponent\'s Potential Criticisms:</strong></p>\n    <ul class="list-disc ml-8">\n      <li>Inexperience in politics and governance</li>\n      <li>Lack of specific knowledge related to policy-making</li>\n    </ul>\n  </div>\n  <div class="bg-gray-200 p-4">\n    <h2 class="mb-2 text-xl font-bold">What My Opponent Will Say About Themselves</h2>\n    <p>Amy Dragotta\'s opponent, Brian Hawley, may highlight his affiliation with the Republican Party and present himself as a politician with experience and insight into local government affairs. Additionally, he may emphasize his wife\'s role as a commissioner as a testament to his familiarity with the workings and challenges of the political landscape. Similarly, if Bob Jusnes or Mike Hill are her opponents, they may showcase their respective backgrounds as a business owner with construction experience and a retired State Trooper.</p>\n    <p class="mt-4"><strong>Opponent Descriptions:</strong></p>\n    <ul class="list-disc ml-8">\n      <li><strong>Brian Hawley:</strong> A politician affiliated with the Republican Party, whose wife serves as a commissioner.</li>\n      <li><strong>Bob Jusnes:</strong> A business owner with construction experience.</li>\n      <li><strong>Mike Hill:</strong> A retired State Trooper.</li>\n    </ul>\n  </div>\n</div>',
    mobilizing:
      '<div class="bg-white p-4">\n  <h2 class="text-2xl font-bold mb-4">Field Plan for Amy Dragotta</h2>\n\n  <h3 class="text-xl font-semibold mb-2">1. Voter Targeting</h3>\n  <p>\n    Base Voters: Independents, Democrats, and Republicans who align with Amy Dragotta\'s messages of investing in local public education, infrastructure, job creation, and park maintenance.\n    <br>\n    Persuadable Voters: Republicans who may be open to supporting Amy Dragotta\'s platform, especially those dissatisfied with the current party or interested in her experience as a Special Education Teacher.\n    <br>\n    Opponent Supporters to Avoid: Supporters of Brian Hawley and Mike Hill, particularly those who prioritize party loyalty.\n    <br>\n    Demographics to Focus Outreach: Independents, women, men, and individuals within the age range of 18-65.\n  </p>\n\n  <h3 class="text-xl font-semibold mb-2">2. Canvassing Strategy</h3>\n  <p>\n    Timeline:\n    <br>\n    - Election Day: November 7, 2023\n    <br>\n    - Weekly Door Knocking Goals:\n    <br>\n    &nbsp;&nbsp; Week 1 (8 weeks before election): 400 doors\n    <br>\n    &nbsp;&nbsp; Week 2: 500 doors\n    <br>\n    &nbsp;&nbsp; Week 3: 600 doors\n    <br>\n    &nbsp;&nbsp; Week 4: 700 doors\n    <br>\n    &nbsp;&nbsp; Week 5: 800 doors\n    <br>\n    &nbsp;&nbsp; Week 6: 900 doors\n    <br>\n    &nbsp;&nbsp; Week 7: 1000 doors\n    <br>\n    &nbsp;&nbsp; Week 8: 1100 doors\n    <br>\n    - Shifts Required: Approximately 25 shifts of 4 hours each throughout the campaign.\n  </p>\n\n  <h3 class="text-xl font-semibold mb-2">3. Phone Banking</h3>\n  <p>\n    Timeline:\n    <br>\n    - Election Day: November 7, 2023\n    <br>\n    - Weekly Phone Call Goals:\n    <br>\n    &nbsp;&nbsp; Week 1 (8 weeks before election): 480 calls\n    <br>\n    &nbsp;&nbsp; Week 2: 600 calls\n    <br>\n    &nbsp;&nbsp; Week 3: 720 calls\n    <br>\n    &nbsp;&nbsp; Week 4: 840 calls\n    <br>\n    &nbsp;&nbsp; Week 5: 960 calls\n    <br>\n    &nbsp;&nbsp; Week 6: 1080 calls\n    <br>\n    &nbsp;&nbsp; Week 7: 1200 calls\n    <br>\n    &nbsp;&nbsp; Week 8: 1320 calls\n    <br>\n    - Shifts Required: Approximately 33 shifts of 4 hours each throughout the campaign.\n  </p>\n\n  <h3 class="text-xl font-semibold mb-2">4. Voter Registration</h3>\n  <p>\n    Zip Code 27501: Identify unregistered voters in the area and provide them with information and assistance to register to vote.\n  </p>\n\n  <h3 class="text-xl font-semibold mb-2">5. Get-out-the-vote (GOTV)</h3>\n  <p>\n    Develop a plan to remind supporters to vote, provide information about polling locations and hours, and offer transportation to the polls if needed. Aim to increase supportive voter turn out by 2-5%.\n  </p>\n\n  <h3 class="text-xl font-semibold mb-2">6. Data Management</h3>\n  <p>\n    Implement a comprehensive data management system to track voter contact information, canvassing results, and other relevant data to optimize campaign efforts.\n  </p>\n</div>',
    pathToVictory:
      '<!DOCTYPE html>\n<html lang="en">\n\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <link href="https://cdn.jsdelivr.net<br/><br/>pm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">\n    <title>Vote Analysis</title>\n</head>\n\n<body class="bg-gray-100">\n    <div class="container mx-auto mt-10">\n        <h1 class="text-2xl font-bold mb-5">Vote Analysis</h1>\n\n        <h2 class="text-lg font-bold mb-2">Candidate Information</h2>\n        <ul class="list-disc pl-5">\n            <li>Candidate Name: Amy Dragotta</li>\n            <li>Office Running For: Mayor</li>\n            <li>Political Party: Independent</li>\n            <li>Election Date: 2023-11-07</li>\n        </ul>\n\n        <h2 class="text-lg font-bold mt-6 mb-2">Voter Statistics</h2>\n        <ul class="list-disc pl-5">\n            <li>Total Registered Voters: 5986</li>\n            <li>Average % Turnout: 6%</li>\n            <li>Projected Turnout: 330</li>\n            <li>Win Number: 168</li>\n        </ul>\n\n        <h2 class="text-lg font-bold mt-6 mb-2">Votes Needed by Political Affiliation</h2>\n        <ul class="list-disc pl-5">\n            <li>Democrats: 84 votes (based on 50% voter registration)</li>\n            <li>Republicans: 42 votes (based on 25% voter registration)</li>\n            <li>Independents: 42 votes (based on 25% voter registration)</li>\n        </ul>\n\n        <h2 class="text-lg font-bold mt-6 mb-2">Tactics for Turnout</h2>\n        <h3 class="text-md font-bold mt-4 mb-2">Democrats</h3>\n        <ul class="list-disc pl-5">\n            <li>Organize local community events to engage Democratic voters</li>\n            <li>Develop targeted advertising campaigns highlighting key Democratic policies</li>\n            <li>Mobilize volunteers for door-to-door canvassing and phone banking</li>\n        </ul>\n\n        <h3 class="text-md font-bold mt-4 mb-2">Republicans</h3>\n        <ul class="list-disc pl-5">\n            <li>Host fundraisers and networking events to connect with Republican supporters</li>\n            <li>Create persuasive literature promoting Republican values and Amy Dragotta\'s candidacy</li>\n            <li>Utilize social media platforms to reach out to Republican voters and share campaign updates</li>\n        </ul>\n\n        <h3 class="text-md font-bold mt-4 mb-2">Independents</h3>\n        <ul class="list-disc pl-5">\n            <li>Hold town hall meetings to engage with Independent voters and address their concerns</li>\n            <li>Advertise Amy Dragotta\'s non-partisan approach and ability to work across party lines</li>\n            <li>Collaborate with local organizations to host voter registration drives targeting Independent voters</li>\n        </ul>\n    </div>\n</body>\n\n</html>',
  },
  p2vStatus: 'Waiting',
  goals: {
    electionDate: '2023-11-07',
    runningAgainst: [
      {
        name: 'Brian Hawley',
        description:
          'He is a politician who has a wife in office serving as a commissioner. ',
        party: 'Republican Party',
      },
      {
        name: 'Bob Jusnes',
        description: 'A business owner with construction experience ',
        party: 'Independent',
      },
      {
        name: 'Mike Hill',
        description: 'A retired State Trooper',
        party: 'Republican Party',
      },
    ],
  },
  pathToVictory: {
    totalRegisteredVoters: '5986',
    projectedTurnout: '330',
    winNumber: 168,
    voterContactGoal: '1000',
    republicans: '2259',
    democrats: '1650',
    indies: '2176',
    averageTurnout: '6',
    allAvailVoters: 0,
    availVotersTo35: 0,
    women: 0,
    men: 0,
    africanAmerican: 0,
    white: 0,
    asian: 0,
    hispanic: 0,
    voteGoal: '176',
    voterProjection: 0,
    budgetLow: '1000',
    budgetHigh: '2500',
    voterMap: '',
    finalVotes: 0,
  },
  profile: {
    campaignWebsite: 'https://www.linkedin.com/in/amy-dragotta-1b64a856',
  },
  launchStatus: 'launched',
  candidateSlug: 'amy-dragotta',
  reportedVoterGoals: { doorKnocking: 30, calls: 0, digital: 0 },
};
