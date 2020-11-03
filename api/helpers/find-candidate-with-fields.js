module.exports = {
  friendlyName: 'Find by id one Presidential Candidates',

  description: 'Find by id one Presidential Candidates ',

  inputs: {
    id: {
      type: 'string',
      required: true,
    },
    chamber: {
      type: 'string',
      required: true,
    },
    isIncumbent: {
      type: 'boolean',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Candidate Found',
    },
    notFound: {
      description: 'Candidate Not Found',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, chamber, isIncumbent } = inputs;
      let candidate;
      const cached = await sails.helpers.cacheHelper(
        'get',
        `cand-${id}-${chamber}-${isIncumbent}`,
      );
      if (cached) {
        console.log('from cache');
        const {
          sharedCount,
          rankingCount,
          recentActivity,
          activityCount,
        } = await sails.helpers.recentActivity(id, chamber, isIncumbent);
        return exits.success({
          ...cached,
          shares: sharedCount + cached.initialShares,
          rankingCount,
          recentActivity,
          activityCount,
        });
      }

      if (chamber === 'presidential') {
        candidate = await PresidentialCandidate.findOne({
          id,
          isActive: true,
          isHidden: false,
        }).populate('presCandUpdates');
        if (candidate) {
          candidate.campaignUpdates = candidate.presCandUpdates;
          delete candidate.presCandUpdates;
        }
      } else {
        const upperChamber = chamber.charAt(0).toUpperCase() + chamber.slice(1);
        if (isIncumbent) {
          candidate = await Incumbent.findOne({
            id,
            chamber: upperChamber,
          }).populate('incumbentUpdates');
          if (candidate) {
            candidate.isIncumbent = true;
            candidate.campaignUpdates = candidate.incumbentUpdates;
            delete candidate.incumbentUpdates;
          }
        } else {
          candidate = await RaceCandidate.findOne({
            id,
            chamber: upperChamber,
            isActive: true,
            isHidden: false,
          }).populate('raceCandUpdates');
          if (candidate) {
            candidate.campaignUpdates = candidate.raceCandUpdates;
            delete candidate.raceCandUpdates;
          }
        }
      }

      if (!candidate) {
        return exits.notFound();
      }
      candidate.campaignUpdates.sort((a, b) => b.createdAt - a.createdAt);

      let incumbent;
      const { state, district } = candidate || {};
      if (chamber === 'presidential') {
        ({ incumbent } = await sails.helpers.incumbentByDistrictHelper());
      } else if (chamber === 'senate') {
        ({ incumbent } = await sails.helpers.incumbentByDistrictHelper(state));
      } else if (chamber === 'house') {
        ({ incumbent } = await sails.helpers.incumbentByDistrictHelper(
          state,
          district ? parseInt(district, 10) : district,
        ));
      }

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

      const { isGood, isBigMoney } = await sails.helpers.goodnessHelper(
        candidate,
        chamber,
        incumbentRaised,
      );
      candidate.isGood = isGood;
      candidate.isBigMoney = isBigMoney;

      let votesNeeded = await sails.helpers.votesNeeded(candidate);

      await sails.helpers.cacheHelper(
        'set',
        `cand-${id}-${chamber}-${isIncumbent}`,
        {
          ...candidate,
          votesNeeded,
        },
      );

      const {
        sharedCount,
        rankingCount,
        recentActivity,
        activityCount,
      } = await sails.helpers.recentActivity(id, chamber, isIncumbent);

      return exits.success({
        ...candidate,
        votesNeeded,
        shares: sharedCount + candidate.initialShares,
        rankingCount,
        recentActivity,
        activityCount,
      });
    } catch (e) {
      await sails.helpers.errorLoggerHelper(
        'Error at helper/find-candidate',
        e,
      );
      console.log('Error at helper/find-candidate', e);
      return exits.notFound();
    }
  },
};
