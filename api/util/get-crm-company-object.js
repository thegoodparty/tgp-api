const moment = require('moment/moment');
const determineName = async (data, campaignUserId) => {
  const {
    name,
    details
  } = data

  if (name) {
    return name;
  } else if (details?.firstName && details?.lastName) {
    return `${details.firstName} ${details.lastName}`;
  }

  const user = await User.findOne({ id: campaignUserId });
  return await sails.helpers.user.name(user)
}

const getCRMCompanyObject = async (campaign) => {
  const { data, isActive, isVerified, dateVerified, isPro } = campaign || {};
  const {
    lastStepDate,
    goals,
    details,
    currentStep,
    aiContent,
    reportedVoterGoals,
    p2vStatus,
    p2vCompleteDate
  } = data || {};
  const electionDate = goals?.electionDate || undefined
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
    runForOffice
  } = details || {};
  const name = await determineName(data, campaign.user);

  //UNIX formatted timestamps in milliseconds
  const electionDateMs = electionDate
    ? new Date(electionDate).getTime()
    : undefined;

  const resolvedOffice = office === 'Other' ? otherOffice : office;

  const longState = state
    ? await sails.helpers.zip.shortToLongState(state)
    : undefined;

  const verifiedCandidate = isVerified ? 'Yes' : 'No'

  const formattedDate = dateVerified !== null ?
    moment(new Date(dateVerified)).format('YYYY-MM-DD') : null

  return {
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
      doors_knocked: reportedVoterGoals?.doorKnocking || 0,
      calls_made: reportedVoterGoals?.calls || 0,
      online_impressions: reportedVoterGoals?.digital || 0,
      my_content_pieces_created: aiContent
        ? Object.keys(data.aiContent).length
        : 0,
      filed_candidate: campaignCommittee ? 'yes' : 'no',
      pro_candidate: isPro ? 'Yes' : 'No',
      ...(
        isVerified !== null ?
          { verified_candidates: verifiedCandidate } :
          {}
      ),
      ...(
        formattedDate !== null ?
          { date_verified: formattedDate } :
          {}
      ),
      ...(website ? { website } : {}),
      ...(level ? { ai_office_level: level } : {}),
      ...(ballotLevel ? { office_level: ballotLevel } : {}),
      ...(runForOffice ? { running: runForOffice } : {})
    },
  }
}

module.exports = {
  getCRMCompanyObject
}
