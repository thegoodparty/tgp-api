/**
 * district/congDistrict
 *
 * @description :: returns data about one Congressional District.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const presidentialYear = true;

module.exports = {
  friendlyName: 'Update Voterize',

  description: 'Update Voterize',

  inputs: {
    candidate: {
      type: 'json',
      required: true,
      description: "Updated Candidate",
    },
    likelyVoters: {
      type: 'number',
      description: "Updated LikelyVoters"
    },
    votesNeeded: {
      type: 'number',
      description: "Updated VotesNeeded"
    }
  },

  exits: {
    success: {
      description: 'Update Voterize',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error updating Voterize',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidate, likelyVoters, votesNeeded } = inputs;
      const { chamber, state, district, id } = candidate;
      const lowerChamber = chamber.toLowerCase();
      let newVotesNeeded;
      if(likelyVoters) {
        if (lowerChamber === 'presidential') {
          await PresidentialCandidate.updateOne({ id }).set({likelyVoters});
        } else if (isIncumbent) {
          await Incumbent.updateOne({ id }).set({likelyVoters});
        } else {
          await RaceCandidate.updateOne({ id }).set({likelyVoters});
        }
      }
      else {
        if (lowerChamber === 'senate') {
          const stateRecord = await State.findOne({ shortName: state });
          if (stateRecord) {
            if(stateRecord.writeInThreshold > stateRecord.writeInThresholdWithPresident) {
              await State.updateOne({
                shortName: state,
              }).set({writeInThreshold: votesNeeded - 1});
              newVotesNeeded = Math.max(
                  votesNeeded,
                  stateRecord.writeInThresholdWithPresident,
                ) + 1;
            } else {
              await State.updateOne({
                shortName: state,
              }).set({writeInThresholdWithPresident: votesNeeded - 1});
              newVotesNeeded = Math.max(
                  votesNeeded,
                  stateRecord.writeInThreshold,
                ) + 1;
            }
            
          }
        } else {
          const stateRecord = await State.findOne({ shortName: state });
          const congDistrict = await CongDistrict.findOne({
            state: stateRecord.id,
            code: district,
          });
          if (congDistrict) {
            if(congDistrict.writeInThreshold > congDistrict.writeInThresholdWithPresident) {
              await CongDistrict.updateOne({
                state: stateRecord.id,
                code: district
              }).set({writeInThreshold: votesNeeded - 1});
              newVotesNeeded = Math.max(
                  votesNeeded,
                  congDistrict.writeInThresholdWithPresident,
                ) + 1;
            } else {
              await CongDistrict.updateOne({
                state: stateRecord.id,
                code: district
              }).set({writeInThresholdWithPresident: votesNeeded - 1});
              newVotesNeeded = Math.max(
                  votesNeeded,
                  congDistrict.writeInThreshold,
                ) + 1;
            }
          }
      }
      }
      return exits.success({ newVotesNeeded });
    } catch (err) {
      console.log(err);
      return exits.badRequest({
        message: 'Error editing voterize',
      });
    }
  },
};
