const { parse } = require('dotenv');
const moment = require('moment/moment');
const determineName = async (campaignUser) => {
  if (campaignUser?.firstName) {
    return `${campaignUser.firstName} ${campaignUser.lastName}`;
  }
  let id = campaignUser;
  if (typeof campaignUser === 'object') {
    id = campaignUser?.id;
  }
  const user = id ? await User.findOne({ id }) : null;
  return user ? await sails.helpers.user.name(user) : '';
};

// Some Hubspot keys couldn't be changed, see:
// https://goodpartyorg.slack.com/archives/C01AEH4TEBX/p1716572940340399?thread_ts=1716563708.979759&cid=C01AEH4TEBX
const KEEP_SNAKECASE = ['p2vStatus', 'p2vCompleteDate', 'winNumber'];
const P2V_FIELDS = [
  { key: 'totalRegisteredVoters', hubSpotKey: 'totalregisteredvoters' },
  { key: 'republicans', hubSpotKey: 'republicans' },
  { key: 'democrats', hubSpotKey: 'democrats' },
  { key: 'indies', hubSpotKey: 'indies' },
  { key: 'asians', hubSpotKey: 'asian' },
  { key: 'africanAmerican', hubSpotKey: 'africanamerican' },
  { key: 'hispanic', hubSpotKey: 'hispanic' },
  { key: 'white', hubSpotKey: 'white' },
  { key: 'likelyVotes', hubSpotKey: 'likely_voters' },
  { key: 'projectedTurnout', hubSpotKey: 'projectedturnout' },
  { key: 'voterContactGoal', hubSpotKey: 'votercontactgoal' },
  { key: 'voterProjection', hubSpotKey: 'voterprojection' },
  { key: 'men', hubSpotKey: 'men' },
  { key: 'women', hubSpotKey: 'women' },
];

const getP2VValues = (p2vData = {}) => {
  console.log('p2vData', p2vData);
  const p2v = Object.keys(p2vData)
    .filter((key) => KEEP_SNAKECASE.includes(key))
    .reduce(
      (result, key) => ({
        ...result,
        [key.toLowerCase()]: p2vData[key],
      }),
      {},
    );
  delete p2v.p2vStatus;
  delete p2v.p2vCompleteDate;
  delete p2v.winNumber;
  delete p2v.winnumber;
  // add P2V_FIELDS
  P2V_FIELDS.forEach(({ key, hubSpotKey }) => {
    if (p2vData[key] !== undefined) {
      p2v[hubSpotKey] = p2vData[key];
    }
  });
  if (p2v.votercontactgoal) {
    p2v.votercontactgoal = parseInt(p2v.votercontactgoal);
  }
  return p2v;
};

const getCrmCompanyObject = async (inputs, exits) => {
  const { campaign } = inputs;
  const { data, aiContent, details, isActive, isPro } = campaign || {};

  const p2v = await PathToVictory.findOne({ campaign: campaign.id });

  const {
    p2vStatus,
    p2vCompleteDate,
    winNumber,
    p2vNotNeeded,
    totalRegisteredVoters,
    viability,
  } = p2v?.data || {};

  const { candidates, isIncumbent, seats, score, isPartisan } = viability || {};

  const { lastStepDate, currentStep, reportedVoterGoals } = data || {};

  const {
    zip,
    party,
    office,
    ballotLevel,
    level,
    state,
    pledged,
    campaignCommittee,
    otherOffice,
    district,
    city,
    website,
    runForOffice,
    electionDate,
    primaryElectionDate,
    filingPeriodsStart,
    filingPeriodsEnd,
    isProUpdatedAt,
  } = details || {};

  const canDownloadVoterFile =
    await sails.helpers.campaign.canDownloadVoterFile(campaign.id);

  const name = await determineName(campaign.user);

  const formatDateForCRM = (date) =>
    date ? moment.utc(date).startOf('day').valueOf().toString() : undefined;

  const electionDateMs = formatDateForCRM(electionDate);
  const primaryElectionDateMs = formatDateForCRM(primaryElectionDate);
  const isProUpdatedAtMs = formatDateForCRM(isProUpdatedAt);
  const p2vCompleteDateMs = formatDateForCRM(p2vCompleteDate);
  const filingStartMs = formatDateForCRM(filingPeriodsStart);
  const filingEndMs = formatDateForCRM(filingPeriodsEnd);

  const resolvedOffice = office === 'Other' ? otherOffice : office;

  const longState = state
    ? await sails.helpers.zip.shortToLongState(state)
    : undefined;

  const p2v_status =
    p2vNotNeeded || !p2vStatus
      ? 'Locked'
      : totalRegisteredVoters
      ? 'Complete'
      : p2vStatus;

  let properties = {
    name,
    candidate_party: party,
    candidate_office: resolvedOffice,
    state: longState,
    candidate_state: longState,
    candidate_district: district,
    city,
    type: 'CAMPAIGN',
    last_step: isActive ? 'onboarding-complete' : currentStep,
    last_step_date: lastStepDate || undefined,
    zip,
    pledge_status: pledged ? 'yes' : 'no',
    is_active: !!name,
    live_candidate: isActive,
    p2v_complete_date: p2vCompleteDateMs,
    p2v_status,
    election_date: electionDateMs,
    primary_date: primaryElectionDateMs,
    doors_knocked: reportedVoterGoals?.doorKnocking || 0,
    direct_mail_sent: reportedVoterGoals?.directMail || 0,
    calls_made: reportedVoterGoals?.calls || 0,
    online_impressions: reportedVoterGoals?.digitalAds || 0,
    p2p_sent: reportedVoterGoals?.text || 0,
    event_impressions: reportedVoterGoals?.events || 0,
    yard_signs_impressions: reportedVoterGoals?.yardSigns || 0,
    my_content_pieces_created: aiContent ? Object.keys(aiContent).length : 0,
    filed_candidate: campaignCommittee ? 'yes' : 'no',
    pro_candidate: isPro ? 'Yes' : 'No',
    pro_upgrade_date: isProUpdatedAtMs,
    filing_start: filingStartMs,
    filing_end: filingEndMs,
    ...(website ? { website } : {}),
    ...(level ? { ai_office_level: level } : {}),
    ...(ballotLevel ? { office_level: ballotLevel } : {}),
    ...(runForOffice ? { running: runForOffice } : {}),
    ...getP2VValues(p2v?.data),
    win_number: winNumber,
    voter_data_adoption: canDownloadVoterFile ? 'Unlocked' : 'Locked',
  };

  if (candidates && typeof candidates === 'number' && candidates > 0) {
    const opponents = candidates - 1;
    properties.opponents = opponents.toString();
  }
  if (isIncumbent !== undefined && typeof isIncumbent === 'boolean') {
    if (isIncumbent) {
      properties.incumbent = 'Yes';
    } else {
      properties.incumbent = 'No';
    }
  }
  if (seats && typeof seats === 'number' && seats > 0) {
    properties.seats_available = seats;
  }
  if (score && typeof score === 'number' && score > 0) {
    if (score > 5) {
      score = 5;
    }
    properties.automated_score = Math.floor(score);
  }
  if (isPartisan !== undefined && typeof isPartisan === 'boolean') {
    if (isPartisan) {
      properties.partisan_np = 'Partisan';
    } else {
      properties.partisan_np = 'Nonpartisan';
    }
  }

  delete properties.winnumber;
  delete properties.p2vStatus;
  delete properties.p2vstatus;
  delete properties.p2vCompleteDate;
  delete properties.p2vcompletedate;

  exits.success({
    properties,
  });
};

module.exports = {
  inputs: {
    campaign: {
      type: 'ref',
      description: 'The campaign object to generate a CRM company object for',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'Successfully generated CRM company object',
    },
  },
  fn: getCrmCompanyObject,
};

const p2vExample = {
  p2vStatus: 'Complete',
  totalRegisteredVoters: 3252,
  republicans: 1118,
  democrats: 580,
  indies: 1554,
  women: 1720,
  men: 1531,
  white: 2740,
  asian: 30,
  africanAmerican: 16,
  hispanic: 69,
  averageTurnout: 1339,
  projectedTurnout: 1334,
  p2vCompleteDate: '2024-10-25',
  winNumber: '681.00',
  voterContactGoal: '3405.00',
  electionType: 'Village',
  electionLocation: 'NC##FLAT ROCK VLG',
};

/* requirements:
    Total Voters maps to totalregisteredvoters

    Democrats maps to democrats

    Republicans maps to republicans

    Independents maps to indies

    Asian voters maps to asian

    african american maps to africanamerican

    hispanic maps to hispanic

    white maps to white

    likely votes maps to likely_voters

    Projected turnout maps to projectedturnout

    Voter contact goal maps to votercontactgoal

    Win Number maps to win_number

    Voter Projection maps to voterprojection

    Women voters maps to women

    Male voters maps to men
*/
