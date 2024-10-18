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

const getP2VValues = (p2vData = {}) => {
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

  const properties = {
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
    properties.candidate_priority = Math.floor(score);
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
