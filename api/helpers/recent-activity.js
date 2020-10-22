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
      description: 'Recent Activity found',
    },
    badRequest: {
      description: 'Recent Activity Not Found',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, chamber, isIncumbent } = inputs;
      let candidate;

      let rankingCount = await Ranking.count({
        candidate: id,
        chamber,
        isIncumbent,
      });

      const recentlyJoinedRecords = await Ranking.find({
        candidate: id,
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

      const sharedCount = await Share.count({
        candidateId: id,
        chamber,
        isIncumbent,
      });

      const recentlySharedRecords = await Share.find({
        candidateId: id,
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

      return exits.success({
        sharedCount,
        rankingCount,
        recentActivity,
        activityCount: rankingCount + sharedCount,
      });
    } catch (e) {
      console.log('Error at helper/recent-activity', e);
      return exits.badRequest();
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
