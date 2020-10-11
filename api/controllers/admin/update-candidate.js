module.exports = {
  friendlyName: 'All Candidates',

  description: 'admin call for getting all candidates',

  inputs: {
    id: {
      type: 'number',
    },
    updatedFields: {
      type: 'json',
    },
    updates: {
      type: 'json',
    },
    chamber: {
      type: 'string',
    },
    isIncumbent: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error getting candidates',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, updatedFields, updates, chamber, isIncumbent } = inputs;

      let candidate;
      if (chamber === 'presidential') {
        candidate = await PresidentialCandidate.updateOne({
          id,
        }).set(updatedFields);
      } else if (isIncumbent) {
        candidate = await Incumbent.updateOne({
          id,
        }).set(updatedFields);
        candidate.isIncumbent = true;
      } else {
        candidate = await RaceCandidate.updateOne({
          id,
        }).set(updatedFields);
      }

      // updates
      if (updates) {
        if (updates.existing) {
          const existingUpdates = updates.existing;
          if (existingUpdates.length > 0) {
            for (let i = 0; i < existingUpdates.length; i++) {
              if (existingUpdates[i] && existingUpdates[i].id) {
                const { id, text } = existingUpdates[i];
                if (text && text !== '') {
                  await CampaignUpdate.updateOne({ id }).set({
                    text,
                  });
                }
              }
            }
          }
        }
        if (updates.newUpdates) {
          const newUpdates = updates.newUpdates;
          if (newUpdates.length > 0) {
            for (let i = 0; i < newUpdates.length; i++) {
              if (newUpdates[i] && newUpdates[i] !== '') {
                const update = await CampaignUpdate.create({
                  text: newUpdates[i],
                }).fetch();
                if (chamber === 'presidential') {
                  await PresidentialCandidate.addToCollection(
                    id,
                    'presCandUpdates',
                    update.id,
                  );
                } else if (isIncumbent) {
                  await Incumbent.addToCollection(
                    id,
                    'incumbentUpdates',
                    update.id,
                  );
                } else {
                  await RaceCandidate.addToCollection(
                    id,
                    'raceCandUpdates',
                    update.id,
                  );
                }
              }
            }
          }
        }
      }

      const { state, district } = candidate || {};
      const incumbent = await sails.helpers.incumbentByDistrictHelper(
        state,
        parseInt(district, 10),
      );
      let incumbentRaised = 50000000;
      if (chamber !== 'presidential') {
        if (candidate.isIncumbent) {
          incumbentRaised = candidate.raised;
        } else {
          incumbentRaised = incumbent
            ? incumbent.raised || incumbent.combinedRaised
            : false;
          incumbentRaised = incumbentRaised ? incumbentRaised / 2 : false;
        }
      }

      const {
        isGood,
        isBigMoney,
        isMajor,
      } = await sails.helpers.goodnessHelper(
        candidate,
        chamber,
        incumbentRaised,
      );
      candidate.isGood = isGood;
      candidate.isBigMoney = isBigMoney;
      candidate.isMajor = isMajor;

      // getting campaign updates
      let candidateUpdates;

      if (chamber === 'presidential') {
        candidateUpdates = await PresidentialCandidate.findOne({
          id,
          isActive: true,
          isHidden: false,
        }).populate('presCandUpdates');
        candidate.campaignUpdates = candidateUpdates.presCandUpdates;
      } else {
        const upperChamber = chamber.charAt(0).toUpperCase() + chamber.slice(1);
        if (isIncumbent) {
          candidateUpdates = await Incumbent.findOne({
            id,
            chamber: upperChamber,
          }).populate('incumbentUpdates');
          candidate.campaignUpdates = candidateUpdates.incumbentUpdates;
        } else {
          candidateUpdates = await RaceCandidate.findOne({
            id,
            chamber: upperChamber,
            isActive: true,
            isHidden: false,
          }).populate('raceCandUpdates');
          candidate.campaignUpdates = candidateUpdates.raceCandUpdates;
        }
      }

      return exits.success({
        candidate,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at admin/update-candidate',
        e,
      );
      return exits.badRequest({
        message: 'Error updating candidates',
      });
    }
  },
};
