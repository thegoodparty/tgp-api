/* eslint-disable object-shorthand */

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    candidateId: {
      type: 'json',
    },
  },

  exits: {
    success: {
      outputDescription: 'Campaign Found',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { candidateId } = inputs;

      const candidate = await BallotCandidate.findOne({
        where: {
          and: [
            { id: candidateId },
            { party: { '!=': 'Republican' } },
            { party: { '!=': 'Democratic' } },
          ],
        },
      })
        .populate('positions')
        .populate('races')
        .populate('elections');

      if (!candidate) {
        return exits.success(false);
      }

      const {
        id,
        slug,
        firstName,
        lastName,
        middleName,
        positionName,
        party,
        state,
        p2vData,
        positions,
        brCandidacyData,
        campaign,
        brData,
      } = candidate;

      // const about = 'whatever'; //TODO: generate AI about here
      let officeDescription;
      let salary;
      let term;
      let image;
      if (positions && positions.length) {
        officeDescription = positions[0].data.description;
        term =
          positions[0].data.electionFrequencies &&
          positions[0].data.electionFrequencies.length
            ? `${positions[0].data.electionFrequencies[0].frequency[0]} Years`
            : undefined;
        salary = positions[0].data.salary;
      }
      if (brData?.image_url) {
        image = brData.image_url;
      }
      let topIssues;
      if (brCandidacyData?.stances && brCandidacyData.stances.length) {
        topIssues = brCandidacyData.stances.map((s) => {
          return {
            issue: s.issue.name,
            stance: s.statement,
            referenceUrl: s.referenceUrl,
          };
        });
      }

      const data = {
        id,
        slug,
        firstName,
        lastName,
        middleName,
        office: positionName,
        party,
        state,
        ...(p2vData || {}),
        // about,
        officeDescription,
        term,
        salary,
        endorsements: brCandidacyData?.endorsements,
        topIssues,
        image,
        claimed: !!campaign,
      };

      const { mtfcc, geo_id, urls } = brData;
      const geoData = await resolveMtfcc(mtfcc, geo_id);
      data.geoData = geoData;
      if (geoData?.city) {
        data.city = geoData.city;
      }

      const socialUrls = parseUrl(urls);

      data.socialUrls = socialUrls;

      // keep about last so we send all the data to the AI
      const about = await generateAboutAi(data);
      data.about = about;

      return exits.success(data);
    } catch (e) {
      console.log('error in helpers/candidate/generate-presentation', e);
      return exits.success(false);
    }
  },
};
async function resolveMtfcc(mtfcc, geoId) {
  let geoData;
  if (mtfcc && geoId) {
    const census = await CensusEntity.findOne({ mtfcc, geoId });
    if (census) {
      geoData = {
        name: census.name,
        type: census.mtfccType,
      };
      if (census.mtfccType !== 'State or Equivalent Feature') {
        geoData.city = census.name;
      }
    }
  }
  return geoData;
}

async function generateAboutAi(data) {
  let messages = [
    {
      role: 'system',
      content: 'You are a helpful political assistant.',
    },
    {
      role: 'user',
      content: `I need you to generate one paragraph of summary about this candidate. this is data about the candidate: ${JSON.stringify(
        data,
      )}`,
    },
  ];

  const completion = await sails.helpers.ai.createCompletion(messages);
  if (completion && completion.content) {
    return completion.content;
  }
}

function parseUrl(urls) {
  //urls: '[{"type"=>"facebook", "website"=>"https://www.facebook.com/DevineForSenate"}, {"type"=>"government", "website"=>"https://www.scstatehouse.gov/member.php?code=0477840852"}, {"type"=>"linkedin", "website"=>"https://www.linkedin.com/in/tameikaisaacdevine/"}, {"type"=>"twitter", "website"=>"https://twitter.com/TIDEVINE"}, {"type"=>"website", "website"=>"https://devineforsenate.com/"}]',
  let parsedUrls;
  try {
    if (!urls) {
      return;
    }
    const cleanUrls = urls.replace(/=>/g, ':');
    parsedUrls = JSON.parse(cleanUrls);
    if (parsedUrls && parsedUrls.length) {
      parsedUrls = parsedUrls.map((url) => {
        return {
          type: url.type,
          url: url.website,
        };
      });
    }
  } catch (e) {
    console.log('error parsing urls', e);
  }
  return parsedUrls;
}

/*
candidate example:

*/

const exampleCandidate = {
  createdAt: 1719114209023,
  updatedAt: 1719114342589,
  id: 1,
  slug: 'tameika-devine-south-carolina-state-senate-district-19',
  brCandidateId: '600701',
  bpCandidateId: '',
  firstName: 'Tameika',
  middleName: 'Isaac',
  lastName: 'Devine',
  state: 'SC',
  parsedLocation: '',
  positionName: 'South Carolina State Senate - District 19',
  normalizedPositionName: 'State Senator',
  email: 'info@devineforsenate.com',
  phone: '803-254-8868',
  vendorTsPhone: '',
  vendorTsEmail: '',
  ballotHashId: '',
  raceId: '2790400',
  positionId: '48548',
  electionId: '7050',
  party: 'Democratic',
  electionName: 'South Carolina Special General Election',
  electionDay: '2024-01-02',
  electionResult: 'GENERAL_WIN',
  level: 'state',
  tier: '2',
  isJudicial: false,
  isRetention: false,
  isPrimary: false,
  isRunoff: false,
  isUnexpired: true,
  positions: [
    {
      createdAt: 1718851830606,
      updatedAt: 1718851830606,
      id: 1,
      ballotId: '48548',
      ballotHashId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb24vNDg1NDg=',
      data: {
        appointed: false,
        createdAt: '2017-12-15T20:04:07Z',
        databaseId: 48548,
        description:
          "State Senators are members of the state's upper chamber, as part of the state's bicameral legislature. State senators are responsible for voting on: bills related to public policy matters, levels for state spending, raises or decreases in taxes, and whether to uphold or override gubernatorial vetoes.",
        eligibilityRequirements:
          'At least 25 years old, US citizen, state resident, registered voter, legal resident of the district at the time of filing',
        employmentType: 'Part Time',
        filingAddress:
          'State Election Commission, 1122 Lady Street, Suite 500, Columbia, SC 29201',
        filingPhone: '803-734-9060',
        filingRequirements:
          'Filing fee is $416; signature requirement of at least 5% of the active, registered voters in the geographical area the office represents',
        geoId: '45019',
        hasMajorityVotePrimary: false,
        hasPrimary: true,
        hasRankedChoiceGeneral: false,
        hasRankedChoicePrimary: false,
        hasUnknownBoundaries: false,
        id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb24vNDg1NDg=',
        judicial: false,
        level: 'STATE',
        maximumFilingFee: 416,
        minimumAge: 25,
        mtfcc: 'G5210',
        mustBeRegisteredVoter: true,
        mustBeResident: true,
        mustHaveProfessionalExperience: false,
        name: 'South Carolina State Senate - District 19',
        paperworkInstructions:
          "Submit paperwork to the State Election Commission's office.",
        partisanType: 'partisan',
        rankedChoiceMaxVotesGeneral: null,
        rankedChoiceMaxVotesPrimary: null,
        retention: false,
        rowOrder: 600,
        runningMateStyle: null,
        salary: '$10,400/year + $140 per diem',
        seats: 1,
        selectionsAllowed: 1,
        slug: 'south-carolina-south-carolina-state-senate-district-19',
        staggeredTerm: false,
        state: 'SC',
        subAreaName: 'District',
        subAreaValue: '19',
        tier: 2,
        updatedAt: '2023-02-15T16:27:30Z',
        officeHolders: {
          nodes: [],
        },
        electionFrequencies: [
          {
            databaseId: 1123697,
            frequency: [4],
            id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb25FbGVjdGlvbkZyZXF1ZW5jeS8xMTIzNjk3',
            referenceYear: 2024,
            seats: null,
            validFrom: '2020-01-01',
            validTo: null,
          },
        ],
      },
      ballotElection: null,
    },
  ],
  races: [
    {
      createdAt: 1718898344108,
      updatedAt: 1718898344108,
      id: 2,
      ballotId: '2790400',
      ballotHashId:
        'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb25FbGVjdGlvbi8yNzkwNDAw',
      hashId: '85e69d',
      positionSlug: 'state-senator',
      state: 'SC',
      electionDate: 1704153600000,
      level: 'state',
      subAreaName: 'District',
      subAreaValue: '19',
      isJudicial: false,
      isPrimary: false,
      data: {
        position_name: 'South Carolina State Senate - District 19',
        state: 'SC',
        race_id: 2790400,
        is_primary: false,
        is_judicial: false,
        sub_area_name: 'District',
        sub_area_value: '19',
        filing_periods: '[]',
        election_day: '2024-01-02',
        normalized_position_name: 'State Senator',
        level: 'state',
      },
      county: null,
      municipality: null,
    },
  ],
  elections: [
    {
      createdAt: 1718852296793,
      updatedAt: 1718852296793,
      id: 1,
      ballotId: '7050',
      ballotHashId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvRWxlY3Rpb24vNzA1MA==',
      electionDate: '2024-01-02',
      state: 'SC',
      data: {
        electionDay: '2024-01-02',
        id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvRWxlY3Rpb24vNzA1MA==',
        name: 'South Carolina Special General Election',
        originalElectionDate: '2024-01-02',
        raceCount: 1,
        slug: 'south-carolina-special-general-election-2016b2c4-7d03-4c54-ae04-d792b633d553',
        state: 'SC',
        timezone: 'America/New_York',
        updatedAt: '2023-12-21T00:31:43Z',
        votingInformationPublishedAt: '2023-11-29T00:00:00Z',
        databaseId: 7050,
        ballotsSentOutBy: '2023-12-03',
      },
    },
  ],
  brData: {
    id: '840364',
    candidacy_id: '840364',
    election_id: '7050',
    election_name: 'South Carolina Special General Election',
    election_day: '2024-01-02',
    position_id: '48548',
    mtfcc: 'G5210',
    geo_id: '45019',
    position_name: 'South Carolina State Senate - District 19',
    sub_area_name: 'District',
    sub_area_value: '19',
    sub_area_name_secondary: '',
    sub_area_value_secondary: '',
    state: 'SC',
    level: 'state',
    tier: '2',
    is_judicial: 'false',
    is_retention: 'false',
    number_of_seats: '1',
    normalized_position_id: '600',
    normalized_position_name: 'State Senator',
    race_id: '2790400',
    geofence_id: '1184057',
    geofence_is_not_exact: 'false',
    is_primary: 'false',
    is_runoff: 'false',
    is_unexpired: 'true',
    candidate_id: '600701',
    first_name: 'Tameika',
    middle_name: 'Isaac',
    nickname: '',
    last_name: 'Devine',
    suffix: '',
    phone: '803-254-8868',
    email: 'info@devineforsenate.com',
    image_url:
      'https://assets.civicengine.com/uploads/candidate/headshot/600701/600701.jpg',
    parties: '[{"name"=>"Democratic", "short_name"=>"D"}]',
    urls: '[{"type"=>"facebook", "website"=>"https://www.facebook.com/DevineForSenate"}, {"type"=>"government", "website"=>"https://www.scstatehouse.gov/member.php?code=0477840852"}, {"type"=>"linkedin", "website"=>"https://www.linkedin.com/in/tameikaisaacdevine/"}, {"type"=>"twitter", "website"=>"https://twitter.com/TIDEVINE"}, {"type"=>"website", "website"=>"https://devineforsenate.com/"}]',
    election_result: 'GENERAL_WIN',
    candidacy_created_at: '2023-10-25 19:21:04.596',
    candidacy_updated_at: '2024-01-09 20:12:11.812',
  },
  brCandidacyData: {
    createdAt: '2023-10-25T19:21:04Z',
    databaseId: 840364,
    id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvQ2FuZGlkYWN5Lzg0MDM2NA==',
    isCertified: true,
    isHidden: false,
    result: 'WON',
    uncertified: false,
    updatedAt: '2024-01-09T20:12:11Z',
    withdrawn: false,
    endorsements: [],
    stances: [
      {
        databaseId: 8913339,
        id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvU3RhbmNlLzg5MTMzMzk=',
        locale: 'en',
        referenceUrl: 'https://devineforsenate.com/issues/',
        statement:
          'Tameika Isaac Devine knows our communities and the people of Senate District 19 because she is one of us. That’s why we count on her to address and work tirelessly to insure projects that improve our infrastructure (like roads and water lines) are fulfilled in a timely manner and not stretched out for decades. She will also be an advocate for better planning and timing of projects that reduce traffic congestion. And most importantly, Tameika Isaac Devine believes growth and development should not be a zero-sum process and everyone should thrive from redevelopment.',
        issue: {
          databaseId: 30,
          id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvSXNzdWUvMzA=',
          name: 'Infrastructure / Transportation',
          pluginEnabled: true,
          responseType: null,
          rowOrder: null,
        },
      },
      {
        databaseId: 8910794,
        id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvU3RhbmNlLzg5MTA3OTQ=',
        locale: 'en',
        referenceUrl: 'https://devineforsenate.com/issues/',
        statement:
          'Tameika Isaac Devine knows the value of our schools and teachers and understands how strong education systems unlock the doors to opportunities. That’s why she has been a strong supporter of all three school districts in Richland County and Senate District 19, and has advocated for full funding of our schools and getting more dollars into the classrooms.',
        issue: {
          databaseId: 6,
          id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvSXNzdWUvNg==',
          name: 'Education',
          pluginEnabled: true,
          responseType: null,
          rowOrder: null,
        },
      },
      {
        databaseId: 8910797,
        id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvU3RhbmNlLzg5MTA3OTc=',
        locale: 'en',
        referenceUrl: 'https://devineforsenate.com/issues/',
        statement:
          'As our next State Senator, we can count on Tameika to support our First Responders, invest in more pre-emptive programs that combat youth violence, and work hand in hand with our community to reduce crime and improve the public safety of every neighborhood in Senate District 19.',
        issue: {
          databaseId: 62,
          id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvSXNzdWUvNjI=',
          name: 'Criminal Justice / Public Safety',
          pluginEnabled: true,
          responseType: null,
          rowOrder: null,
        },
      },
      {
        databaseId: 8910796,
        id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvU3RhbmNlLzg5MTA3OTY=',
        locale: 'en',
        referenceUrl: 'https://devineforsenate.com/issues/',
        statement:
          'Tameika Isaac Devine is a strong proponent of protecting South Carolina’s most precious natural resources. She has been a strong supporter of Land Bank legislation in the past and will be a sponsor of legislation that protects more land in the future for generations in the future to preserve.',
        issue: {
          databaseId: 12,
          id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvSXNzdWUvMTI=',
          name: 'Environment / Energy',
          pluginEnabled: true,
          responseType: null,
          rowOrder: null,
        },
      },
      {
        databaseId: 8910795,
        id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvU3RhbmNlLzg5MTA3OTU=',
        locale: 'en',
        referenceUrl: 'https://devineforsenate.com/issues/',
        statement:
          'During her service on City Council, Tameika Isaac Devine was a strong supporter of reducing our dependence on foreign oil and fossil fuels by supporting Columbia’s efforts to embrace hydrogen fuel cells and opening up efforts to move toward electric vehicles. As State Senator for District 19, she will continue those efforts by working to increasing the number of vehicles in the state’s fleet that aren’t run by fossil fuels, as well as support and draft legislation that provides incentives to businesses and local governments who shift away from vehicles and objects that add to the pollution of our state’s clean air.',
        issue: {
          databaseId: 12,
          id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvSXNzdWUvMTI=',
          name: 'Environment / Energy',
          pluginEnabled: true,
          responseType: null,
          rowOrder: null,
        },
      },
    ],
  },
  p2vData: null,
  bpData: null,
  vendorTsData: null,
  presentationData: null,
  campaign: null,
};

const exampleCandidatePresentation = {
  firstName: 'John',
  lastName: 'Doe',
  office: 'City Council, District 7',
  party: 'Independent',
  city: 'Manchester',
  state: 'NH',
  votesNeeded: 5402,
  votersCount: 25321,
  independents: 8414,
  republicans: 9623,
  democrats: 7685,
  about: 'whatever',
  jobHistory: 'Physics Teacher at Manchester High',
  education: 'BS Physics from University of Chicago, Illinois',
  militaryService: 'None',
  previouslyInOffice: 'Yes',
  priorRoles: [
    { office: 'City Clerk', years: '2022 - 2024' },
    { office: 'Alderman', years: '2020 - 2022' },
  ],
  yearsInOffice: 4,
  officeDescription:
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
  term: '4 Years',
  salary: 'Average $82,000/ year',
  topIssues: [
    'Lorem ipsum dolor sit amet.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
  ],
};

const b = {
  id: '896352',
  candidacy_id: '896352',
  election_id: '5186',
  election_name: 'South Carolina Primary Election',
  election_day: '2024-06-11',
  position_id: '48548',
  mtfcc: 'G5210',
  geo_id: '45019',
  position_name: 'South Carolina State Senate - District 19',
  sub_area_name: 'District',
  sub_area_value: '19',
  sub_area_name_secondary: '',
  sub_area_value_secondary: '',
  state: 'SC',
  level: 'state',
  tier: '2',
  is_judicial: 'false',
  is_retention: 'false',
  number_of_seats: '1',
  normalized_position_id: '600',
  normalized_position_name: 'State Senator',
  race_id: '1593289',
  geofence_id: '1184057',
  geofence_is_not_exact: 'false',
  is_primary: 'true',
  is_runoff: 'false',
  is_unexpired: 'false',
  candidate_id: '600701',
  first_name: 'Tameika',
  middle_name: 'Isaac',
  nickname: '',
  last_name: 'Devine',
  suffix: '',
  phone: '803-254-8868',
  email: 'info@devineforsenate.com',
  image_url:
    'https://assets.civicengine.com/uploads/candidate/headshot/600701/600701.jpg',
  parties: '[{"name"=>"Democratic", "short_name"=>"D"}]',
  urls: '[{"type"=>"facebook", "website"=>"https://www.facebook.com/DevineForSenate"}, {"type"=>"government", "website"=>"https://www.scstatehouse.gov/member.php?code=0477840852"}, {"type"=>"linkedin", "website"=>"https://www.linkedin.com/in/tameikaisaacdevine/"}, {"type"=>"twitter", "website"=>"https://twitter.com/TIDEVINE"}, {"type"=>"website", "website"=>"https://devineforsenate.com/"}]',
  election_result: 'PRIMARY_WIN',
  candidacy_created_at: '2024-04-29 10:09:15.615',
  candidacy_updated_at: '2024-06-17 17:28:48.261',
};
