const timeago = require('time-ago');

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
      responseType: 'ok',
    },
    notFound: {
      description: 'Candidate Not Found',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, chamber, isIncumbent } = inputs;
      let candidate;

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
        await sails.helpers.errorLoggerHelper(
          'find-candidate helper - candidate not found',
          `*id*: ${id}
          \n *chamber*: ${chamber}
          \n *isIncumbent*: ${isIncumbent}`,
        );
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

      let rankingCount = await Ranking.count({
        candidate: candidate.id,
        chamber,
        isIncumbent,
      });

      const recentlyJoinedRecords = await Ranking.find({
        candidate: candidate.id,
        chamber,
        isIncumbent,
      })
        .sort([{ createdAt: 'DESC' }])
        .limit(15)
        .populate('user');

      const recentlyJoined = [];
      for (let i = 0; i < recentlyJoinedRecords.length; i++) {
        const rankWithUser = recentlyJoinedRecords[i];
        const { user } = rankWithUser;
        const timeAgo = timeago.ago(new Date(rankWithUser.createdAt));
        let name = '';
        let district = '';
        if (user && user.name) {
          name = await sails.helpers.fullFirstLastInitials(user.name);
        }
        district = await districtFromUser(user);

        recentlyJoined.push({
          timeAgo,
          name,
          district,
          avatar: user ? user.avatar : false,
          type: 'joined',
          createdAt: rankWithUser.createdAt,
        });
      }

      const { isGood, isBigMoney } = await sails.helpers.goodnessHelper(
        candidate,
        chamber,
        incumbentRaised,
      );
      candidate.isGood = isGood;
      candidate.isBigMoney = isBigMoney;

      const sharedCount = await Share.count({
        candidateId: id,
        chamber,
        isIncumbent,
      });
      candidate.shares = sharedCount + candidate.initialShares;

      const recentlySharedRecords = await Share.find({
        candidateId: candidate.id,
        chamber,
        isIncumbent,
      })
        .sort([{ createdAt: 'DESC' }])
        .limit(15);

      const recentlyShared = [];
      for (let i = 0; i < recentlySharedRecords.length; i++) {
        const share = recentlySharedRecords[i];
        const timeAgo = timeago.ago(new Date(share.createdAt));

        const user = await User.findOne({ uuid: share.uuid });
        let name = '';
        let district = '';
        if (user && user.name) {
          name = await sails.helpers.fullFirstLastInitials(user.name);
          district = await districtFromUser(user);
        } else {
          name = 'Supporter';
          district = '';
        }
        recentlyShared.push({
          timeAgo,
          name,
          district,
          avatar: user ? user.avatar : false,
          type: 'shared',
          createdAt: share.createdAt,
        });
      }

      const recentActivity = [...recentlyShared, ...recentlyJoined].sort(
        (a, b) => b.createdAt - a.createdAt,
      );

      let votesNeeded = await sails.helpers.votesNeeded(
        chamber,
        candidate.state,
        candidate.district,
      );
      return exits.success({
        ...candidate,
        rankingCount,
        votesNeeded,
        recentActivity,
        activityCount: rankingCount + sharedCount,
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

const properCase = city => {
  if (!city) {
    return '';
  }
  return city
    .split(' ')
    .map(
      w =>
        (w[0] ? w[0].toUpperCase() : '') +
        (w.substr(1) ? w.substr(1).toLowerCase() : ''),
    )
    .join(' ');
};

const districtFromUser = async user => {
  if (!user) {
    return '';
  }
  let city = '';
  if (user.city) {
    city = properCase(user.city);
  } else {
    if (user && user.zipCode) {
      const zipcode = await ZipCode.findOne({ id: user.zipCode });
      if (zipcode) {
        city = zipcode.primaryCity;
      }
    }
  }
  let district = city;
  if (user) {
    district = `${city} ${
      user.shortState ? user.shortState.toUpperCase() : ''
    }${user.districtNumber ? `-${user.districtNumber}` : ''}`;
  }
  return district;
};
