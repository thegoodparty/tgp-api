module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let newRaces = 0;

      // or each BallotCandidate - get position. First look for it in the DB then in ballotReady API.
      const ballotCandidates = await BallotCandidate.find({
        where: { raceId: { '!=': null } },
        select: ['raceId', 'id'],
      });
      for (const ballotCandidate of ballotCandidates) {
        try {
          const { raceId } = ballotCandidate;
          if (raceId) {
            let race = await BallotRace.findOne({
              ballotId: raceId,
            });
            if (!race) {
              const encodedRaceId = await sails.helpers.ballotready.encodeId(
                raceId,
                'PositionElection',
              );
              const brRace = await sails.helpers.ballotready.getRace(
                encodedRaceId,
              );

              let filingPeriods = [];
              for (const fp of brRace.filingPeriods) {
                filingPeriods.push({
                  start_on: fp.startOn,
                  end_on: fp.endOn,
                });
              }
              // for now we match the format of the existing filing_periods field (from csv parse in seed/races)
              // but we may want to change this to an array of objects in the future
              // would need to fix it here and in seed/races and truncate/rerun the seed.
              let fpString = JSON.stringify(filingPeriods);
              fpString = fpString.replace(/"/g, '\\"').replace(/:/g, '=>');

              let raceData = {
                position_name: brRace.position.name,
                state: brRace.position.state,
                race_id: brRace.databaseId,
                is_primary: brRace.isPrimary,
                is_judicial: brRace.position.judicial,
                sub_area_name: brRace.position.subAreaName,
                sub_area_value: brRace.position.subAreaValue,
                filing_periods: fpString,
                election_day: brRace.election.electionDay,
                normalized_position_name:
                  brRace.position.normalizedPosition.name,
                level: brRace.position.level.toLowerCase(),
              };

              console.log('adding race', raceData);
              await sails.helpers.ballotready.addRace(raceData);
              race = await BallotRace.findOne({
                ballotId: raceId,
              });
              if (race) {
                newRaces++;
              }
            }

            if (race) {
              await BallotCandidate.addToCollection(
                ballotCandidate.id,
                'races',
                race.id,
              );
            }
          }
        } catch (e) {
          console.log('error at data-processing/br-positions');
          await sails.helpers.slack.errorLoggerHelper(
            'data-processing/br-positions',
            { ballotCandidateId: ballotCandidate.id, e },
          );
          console.log(e);
        }
      }
      await sails.helpers.slack.errorLoggerHelper('Finished processing races', {
        count: ballotCandidates.length,
        newRaces,
      });
      return exits.success({
        message: 'ok',
        count: ballotCandidates.length,
        newRaces,
      });
    } catch (e) {
      console.log('error at data-processing/br-positions');
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'data-processing/br-positions',
        e,
      );
      return exits.badRequest({
        message: 'unknown error',
        error: e,
      });
    }
  },
};
