/* eslint-disable object-shorthand */
const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    campaignId: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Success',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      // an empty string indicates we don't have the data
      let viability = {
        level: '',
        isPartisan: '',
        isIncumbent: '',
        isUncontested: '',
        candidates: '',
        seats: '',
        candidatesPerSeat: '',
        score: 0,
      };

      const campaign = await Campaign.findOne({
        id: inputs.campaignId,
      });

      if (!campaign) {
        return exits.badRequest('Campaign not found');
      }

      if (campaign?.details?.ballotLevel) {
        viability.level = campaign.details.ballotLevel.toLowerCase();
      }

      let raceId;
      let positionId;
      if (campaign?.details?.raceId && campaign?.details?.positionId) {
        raceId = campaign.details.raceId;
        positionId = campaign.details.positionId;
        console.log('raceId', raceId);
        console.log('positionId', positionId);
      } else {
        return exits.badRequest('RaceId not found');
      }

      let race = await sails.helpers.ballotready.getRaceData(raceId);
      if (!race) {
        return exits.badRequest('Invalid race');
      }
      console.log('positionId on race', race.position.id);
      if (race) {
        viability.isPartisan = race?.isPartisan || false;
        viability.seats = race?.position?.seats || 0;
      }

      let candidates = 0;
      let isIncumbent;
      let isUncontested;

      if (campaign?.ballotCandidate) {
        const ballotCandidate = await BallotCandidate.findOne({
          id: campaign.ballotCandidate,
        });
        console.log('ballotCandidate', ballotCandidate);
        if (ballotCandidate) {
          if (
            ballotCandidate?.vendorTsData?.number_candidates &&
            ballotCandidate.vendorTsData.number_candidates !== ''
          ) {
            candidates = parseInt(
              ballotCandidate.vendorTsData.number_candidates,
            );
            viability.candidates = candidates;
          }
          if (ballotCandidate?.vendorTsData?.is_incumbent !== '') {
            isIncumbent = ballotCandidate.vendorTsData.is_incumbent === 'TRUE';
          }
          if (ballotCandidate?.vendorTsData?.is_uncontested !== '') {
            isUncontested =
              ballotCandidate.vendorTsData.is_uncontested === 'TRUE';
          }
          // Check against Ballotpedia.
          if (
            isIncumbent === undefined &&
            ballotCandidate?.bpData?.is_incumbent !== ''
          ) {
            isIncumbent = ballotCandidate?.bpData?.is_incumbent === 'TRUE';
          }
          if (
            isUncontested === undefined &&
            ballotCandidate?.bpData?.is_uncontested !== ''
          ) {
            isUncontested = ballotCandidate?.bpData?.is_uncontested === 'TRUE';
          }
        }
      }

      if (isIncumbent === undefined) {
        // check and see if ballotReady has the officeHolders data.
        console.log('Checking officeHolders');
        const officeHolders = race?.position?.officeHolders || [];
        if (officeHolders.length > 0) {
          for (const officeHolder of officeHolders) {
            if (
              officeHolder?.node &&
              officeHolder.node.person?.fullName.toLowerCase() ===
                campaign.data.name.toLowerCase()
            ) {
              isIncumbent = true;
            }
          }
        }
      }

      if (isIncumbent !== undefined) {
        viability.isIncumbent = isIncumbent;
      }
      if (isUncontested !== undefined) {
        viability.isUncontested = isUncontested;
      }

      if (candidates === 0) {
        candidates = getBallotReadyCandidates(race, campaign);
      }
      console.log('candidates', candidates);
      if (candidates === 1) {
        // uncontested
        viability.isUncontested = true;
        viability.candidates = 1;
        viability.candidatesPerSeat = 1;
      } else if (candidates > 1) {
        viability.candidates = candidates;
        if (viability.seats > 0) {
          viability.candidatesPerSeat = Math.ceil(candidates / viability.seats);
        }
      }

      viability.score = calculateViabilityScore(viability);

      return exits.success(viability);
    } catch (e) {
      console.log('error at viability-score', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at viability-score',
        e,
      );
      return exits.badRequest('error');
    }
  },
};

function calculateViabilityScore(viability) {
  const {
    level,
    isPartisan,
    isIncumbent,
    isUncontested,
    candidates,
    candidatesPerSeat,
  } = viability;

  let score = 0;
  if (level) {
    if (level === 'city' || level === 'local') {
      score += 1;
    } else if (viability.level === 'county') {
      score += 1;
    } else if (viability.level === 'state') {
      score += 0.5;
    }
  }

  if (typeof isPartisan === 'boolean') {
    if (isPartisan) {
      score += 0.25;
    } else {
      score += 1;
    }
  }

  if (typeof isIncumbent === 'boolean') {
    if (isIncumbent) {
      score += 1;
    } else {
      score += 0.5;
    }
  }

  if (typeof isUncontested === 'boolean') {
    if (isUncontested) {
      score += 5;
      return score;
    }
  }

  if (typeof candidates === 'number') {
    if (candidates > 0) {
      if (candidatesPerSeat <= 2) {
        score += 0.75;
      } else if (candidatesPerSeat === 3) {
        score += 0.5;
      } else if (candidatesPerSeat >= 4) {
        score += 0.25;
      }
    } else {
      score += 0.25;
    }
  }

  return score;
}

function getBallotReadyCandidates(race, campaign) {
  let candidates = 0;
  let candidateSet = new Set();
  const candidacies = race?.candidacies || [];
  if (candidacies && candidacies.length > 0) {
    console.log('candidacies', candidacies);
    for (const candidacy of candidacies) {
      const candidacyName = candidacy.candidate.fullName.toLowerCase();
      const candidateName = campaign.data.name.toLowerCase();
      const candidacyElectionDay = candidacy.election.electionDay;
      console.log('candidacyElectionDay', candidacyElectionDay);
      const candidacyDate = new Date(candidacyElectionDay);
      const electionDate = new Date(campaign.details.electionDate);
      console.log('candidacyName', candidacyName);
      console.log('candidateName', candidateName);
      console.log('candidacyDate', candidacyDate);
      console.log('electionDate', electionDate);
      // todo: debug this for capistrano unified school board.
      // why is it saying 1 candidate? should it be 2 or 3?

      if (candidacyDate < electionDate) {
        console.log('candidacyDate < electionDate');
        if (candidacy.result === 'LOST') {
          if (candidacyName === candidateName) {
            // we lost a primary
            continue;
          } else {
            // rival candidate is no longer in the running
            console.log('skipping candidate', candidacy?.candidate.fullName);
          }
        } else if (candidacy.result === 'WON') {
          if (candidacyName === candidateName) {
            // we won the primary
          } else {
            console.log('adding candidate', candidacy?.candidate.fullName);
            candidateSet.add(candidacy?.candidate.fullName);
          }
        } else {
          if (candidacyName === candidateName) {
            // we are still running.
          } else {
            console.log('adding candidate', candidacy?.candidate.fullName);
            candidateSet.add(candidacy?.candidate.fullName);
          }
        }
      } else if (candidacyDate === electionDate) {
        console.log('candidacyDate === electionDate');
        if (candidacy.result === 'LOST') {
          if (candidacyName === candidateName) {
            // we lost the election
            continue;
          } else {
            // rival candidate is no longer in the running
          }
        } else if (candidacy.result === 'WON') {
          if (candidacyName === candidateName) {
            // we won the election
          } else {
            console.log('adding candidate', candidacy?.candidate.fullName);
            candidateSet.add(candidacy?.candidate.fullName);
          }
        } else {
          if (candidacyName === candidateName) {
            // we are still running.
          } else {
            console.log('adding candidate', candidacy?.candidate.fullName);
            candidateSet.add(candidacy?.candidate.fullName);
          }
        }
      } else {
        console.log('candidacyDate > electionDate');
        if (candidacyName === candidateName) {
          // we are still running.
        } else {
          console.log('adding candidate', candidacy?.candidate.fullName);
          candidateSet.add(candidacy?.candidate.fullName);
        }
      }
    }
  }

  if (candidacies.length > 0) {
    // only run this section if we have candidates
    // because the data is not always available
    console.log('candidateSet', candidateSet);
    let candidateArray = Array.from(candidateSet);
    console.log('candidateArray', candidateArray);
    candidates = candidateArray.length;
    // increment the number of candidates by 1 to include our candidate
    candidates++;
  }
  return candidates;
}
