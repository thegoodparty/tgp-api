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

const getP2VValues = (p2vData = {}) => Object
  .keys(p2vData)
  .reduce((result, key) => ({
    ...result,
    [key.toLowerCase()]: p2vData[key]
  }), {})

const getCrmCompanyObject = async (inputs, exits) => {
  const { campaign } = inputs;
  const {
    data,
    aiContent,
    details,
    isActive,
    isVerified,
    dateVerified,
    isPro,
  } = campaign || {};

  const p2v = await PathToVictory.findOne({ campaign: campaign.id });

  const {
    p2vStatus,
    p2vCompleteDate,
    winNumber
  } = p2v?.data || {};

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
  } = details || {};

  const name = await determineName(campaign.user);

  //UNIX formatted timestamps in milliseconds
  const electionDateMs = electionDate
    ? new Date(electionDate).getTime()
    : undefined;

  const primaryElectionDateMs = primaryElectionDate
    ? new Date(primaryElectionDate).getTime()
    : undefined;

  const resolvedOffice = office === 'Other' ? otherOffice : office;

  const longState = state
    ? await sails.helpers.zip.shortToLongState(state)
    : undefined;

  const verifiedCandidate = isVerified ? 'Yes' : 'No';

  const formattedDate =
    dateVerified !== null
      ? moment(new Date(dateVerified)).format('YYYY-MM-DD')
      : null;

  exits.success({
    properties: {
      name,
      candidate_party: party,
      candidate_office: resolvedOffice,
      state: longState,
      candidate_state: longState,
      candidate_district: district,
      lifecyclestage: 'customer',
      city,
      type: 'CAMPAIGN',
      last_step: currentStep,
      last_step_date: lastStepDate || undefined,
      zip,
      pledge_status: pledged ? 'yes' : 'no',
      is_active: !!name,
      live_candidate: isActive,
      p2v_complete_date: p2vCompleteDate || undefined,
      p2v_status: p2vStatus || 'Locked',
      election_date: electionDateMs,
      primary_date: primaryElectionDateMs,
      doors_knocked: reportedVoterGoals?.doorKnocking || 0,
      calls_made: reportedVoterGoals?.calls || 0,
      online_impressions: reportedVoterGoals?.digital || 0,
      my_content_pieces_created: aiContent ? Object.keys(aiContent).length : 0,
      filed_candidate: campaignCommittee ? 'yes' : 'no',
      pro_candidate: isPro ? 'Yes' : 'No',
      ...(isVerified !== null
        ? { verified_candidates: verifiedCandidate }
        : {}),
      ...(formattedDate !== null ? { date_verified: formattedDate } : {}),
      ...(website ? { website } : {}),
      ...(level ? { ai_office_level: level } : {}),
      ...(ballotLevel ? { office_level: ballotLevel } : {}),
      ...(runForOffice ? { running: runForOffice } : {}),
      ...(getP2VValues(p2v?.data)),
      win_number: winNumber
    },
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
