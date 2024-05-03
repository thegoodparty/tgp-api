module.exports = {
  friendlyName: 'List of onboarding (Admin)',

  inputs: {
    level: {
      type: 'string',
    },
    primaryElectionDateStart: {
      type: 'string',
    },
    primaryElectionDateEnd: {
      type: 'string',
    },
    campaignStatus: {
      type: 'string',
    },
    generalElectionDateStart: {
      type: 'string',
    },
    generalElectionDateEnd: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Onboardings Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const {
        level,
        primaryElectionDateStart,
        primaryElectionDateEnd,
        campaignStatus,
        generalElectionDateStart,
        generalElectionDateEnd,
      } = inputs;

      if (
        !level &&
        !primaryElectionDateStart &&
        !primaryElectionDateEnd &&
        !campaignStatus &&
        !generalElectionDateStart &&
        !generalElectionDateEnd
      ) {
        const query = { user: { '!=': null } };

        const campaigns = await Campaign.find({
          where: query,
        }).populate('user');
        return exits.success({
          campaigns,
        });
      }

      const query = `
      select *
      from public.campaign
      where user is not null
      ${level ? `and details->>'ballotLevel'='${level.toUpperCase()}'` : ''}
      
      order by id desc;
      `;
      console.log('query', query);
      const campaigns = await sails.sendNativeQuery(query);

      return exits.success({
        campaigns: campaigns?.rows || [],
      });
    } catch (e) {
      console.log('Error in onboarding list', e);
      return exits.forbidden();
    }
  },
};

// this is the front end form fields
const formFields = [
  {
    key: 'level',
    label: 'Race Level',
    type: 'select',
    options: ['local', 'state', 'federal'],
  },
  {
    key: 'primaryElectionDateStart',
    label: 'Primary Election Date Start',
    type: 'date',
  },
  {
    key: 'primaryElectionDateEnd',
    label: 'Primary Election Date End',
    type: 'date',
  },
  {
    key: 'campaignStatus',
    label: 'Campaign Status',
    type: 'select',
    options: ['active', 'inactive'],
  },
  {
    key: 'generalElectionDateStart',
    label: 'General Election Date Start',
    type: 'date',
  },
  {
    key: 'generalElectionDateEnd',
    label: 'General Election Date End',
    type: 'date',
  },
];

// this is the details column of the campaign model (jsonb)

const details = {
  dob: '1978-04-24',
  zip: '93065',
  city: 'Oak Park',
  level: 'city',
  party: 'Independent',
  phone: '3109759102',
  state: 'CA',
  office: 'Other',
  raceId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb25FbGVjdGlvbi8xNzQ2OTEx',
  citizen: 'yes',
  funFact:
    "I love playing the guitar and writing songs in my free time. I've even performed at a few local open mic nights! Music has been a passion of mine for as long as I can remember, and I believe that it has helped me to develop creativity, perseverance, and a willingness to take risks. Whether writing a song or crafting a policy proposal, I bring the same enthusiasm and dedication to everything I do.",
  knowRun: 'yes',
  pledged: true,
  articles: '',
  district: 'Maine',
  lastName: 'Almog',
  firstName: 'Tomer',
  runBefore: 'no',
  topIssues: {
    positions: [
      {
        id: 133,
        name: 'Fund Public Schools',
        topIssue: {
          id: 29,
          name: 'Education',
          createdAt: 1649095557491,
          updatedAt: 1649095557491,
        },
        createdAt: 1649095557495,
        updatedAt: 1649095557495,
      },
      {
        id: 137,
        name: 'Stop Book Bans',
        topIssue: {
          id: 29,
          name: 'Education',
          createdAt: 1649095557491,
          updatedAt: 1649095557491,
        },
        createdAt: 1649095557510,
        updatedAt: 1649095557510,
      },
    ],
    'position-12': 'Too many taxes!',
    'position-133': 'Public school needs more funding.',
    'position-137': 'This is the first sign of Tyrany and fear',
  },
  electionId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvRWxlY3Rpb24vNDMxNw==',
  occupation: 'CTO of Good Party',
  otherParty: '',
  positionId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb24vMTYwODgw',
  ballotLevel: 'LOCAL',
  noCommittee: false,
  otherOffice: 'Oak Park Unified School Board',
  customIssues: [
    {
      order: 3,
      title: 'Education',
      position:
        'We need to cancel private schools so rich students will attend public education.',
    },
  ],
  electionDate: '2024-11-05',
  partisanType: 'nonpartisan',
  runForOffice: 'yes',
  campaignPhone: '3109759102',
  filedStatement: 'yes',
  pastExperience:
    'I have 5 years of experience on the local school board, where I worked to improve the quality of education by developing policies, securing funding, and establishing partnerships. This led to higher student achievement, increased graduation rates, and better school facilities. This experience has equipped me with the skills and commitment needed to serve as an elected official.',
  runningAgainst: [
    {
      name: 'John Smith',
      party: 'Democrat Party',
      description: 'John Smith is a corrupt politician ',
    },
    {
      name: 'Another',
      party: 'Democrat Party',
      description: 'whatever',
    },
  ],
  campaignWebsite: 'https://tomeralmog.com',
  officeRunBefore: '',
  officeTermLength: 4,
  campaignCommittee: 'committee of JavaScript',
  priorElectionDates: ['2022-11-08'],
};
