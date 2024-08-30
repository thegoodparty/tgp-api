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
      let score = 0;
      let seats = 0;
      let candidates = 0;
      let candidatesPerSeat = 0;
      let isPartisan = false;
      let isIncumbent = false;
      let isUncontested = false;

      const campaign = await Campaign.findOne({
        id: inputs.campaignId,
      });

      if (!campaign) {
        return exits.badRequest('Campaign not found');
      }

      let level;
      let raceId;
      let positionId;
      if (campaign?.details?.ballotLevel) {
        level = campaign.details.ballotLevel.toLowerCase();
      }
      if (level === 'city') {
        score += 1;
        console.log('City level. score is now', score);
      } else if (level === 'county') {
        score += 1;
        console.log('County level. score is now', score);
      } else if (level === 'state') {
        score += 0.5;
        console.log('State level. score is now', score);
      }

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
        isPartisan = race?.isPartisan;
        console.log('isPartisan', isPartisan);
      }
      if (isPartisan) {
        score += 0.25;
        console.log('Is Partisan. score is now', score);
      } else {
        console.log('Non-partisan. score is now', score);
        score += 1;
      }

      if (campaign?.ballotCandidate) {
        const ballotCandidate = await BallotCandidate.findOne({
          id: campaign.ballotCandidate,
        });
        console.log('ballotCandidate', ballotCandidate);
        if (ballotCandidate) {
          isIncumbent =
            ballotCandidate?.vendorTsData?.is_incumbent &&
            ballotCandidate.vendorTsData.is_incumbent === 'TRUE';
          isUncontested =
            ballotCandidate?.vendorTsData?.is_uncontested &&
            ballotCandidate.vendorTsData.is_uncontested === 'TRUE';
          // Check against Ballotpedia.
          if (!isIncumbent) {
            isIncumbent = ballotCandidate?.bpData?.is_incumbent === 'TRUE';
          }
          if (!isUncontested) {
            isUncontested = ballotCandidate?.bpData?.is_uncontested === 'TRUE';
          }
        }
      }

      if (!isIncumbent) {
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

      if (isIncumbent) {
        score += 1;
        console.log('isIncumbent', 'score is now', score);
      } else {
        score += 0.5;
        console.log('not Incumbent', 'score is now', score);
      }

      if (isUncontested) {
        return exits.success({ score: 5 });
      }

      let candidateSet = new Set();

      const candidacies = race?.candidacies || [];
      if (candidacies && candidacies.length > 0) {
        console.log('candidacies', candidacies);
        for (const candidacy of candidacies) {
          const candidacyName = candidacy.candidate.fullName.toLowerCase();
          const candidateName = campaign.data.name.toLowerCase();
          const candidacyElectionDay = candidacy.candidate.election.electionDay;
          const candidacyDate = new Date(candidacyElectionDay);
          const electionDate = new Date(campaign.details.electionDay);
          if (candidacyDate < electionDate) {
            if (candidacy.result === 'LOST') {
              if (candidacyName === candidateName) {
                // we lost a primary
                return exits.success({ score: 0 });
              } else {
                // rival candidate is no longer in the running
              }
            } else if (candidacy.result === 'WON') {
              if (candidacyName === candidateName) {
                // we won the primary
              } else {
                candidateSet.add(candidacy?.candidate.fullName);
              }
            } else {
              if (candidacyName === candidateName) {
                // we are still running.
              } else {
                candidateSet.add(candidacy?.candidate.fullName);
              }
            }
          } else if (candidacyDate === electionDate) {
            if (candidacy.result === 'LOST') {
              if (candidacyName === candidateName) {
                // we lost the election
                return exits.success({ score: 0 });
              } else {
                // rival candidate is no longer in the running
              }
            } else if (candidacy.result === 'WON') {
              if (candidacyName === candidateName) {
                // we won the election
              } else {
                candidateSet.add(candidacy?.candidate.fullName);
              }
            } else {
              if (candidacyName === candidateName) {
                // we are still running.
              } else {
                candidateSet.add(candidacy?.candidate.fullName);
              }
            }
          }
        }
      }

      if (candidacies.length > 0) {
        // only run this section if we have candidates
        // because the data is not always available
        console.log('candidateSet', candidateSet);
        let candidateArray = Array.from(candidateSet);
        candidates = candidateArray.length;
        // increment the number of candidates by 1 to include our candidate
        candidates++;
        console.log('candidates', candidates);
        if (candidates === 1) {
          // uncontested
          return exits.success({ score: 5 });
        } else if (seats > 0) {
          candidatesPerSeat = candidates / seats;
        }

        // get the "number of candidates per seat"
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

      console.log('score', score);
      return exits.success({ score });
    } catch (e) {
      console.log('error at viability-score', e);
      return exits.badRequest('error');
    }
  },
};
