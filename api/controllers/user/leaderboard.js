/**
 * user/leaderboard.js
 *
 * @description :: Users sorted by crewCount.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Leaderboard',

  description: 'Users sorted by crewCount',
  exits: {
    success: {
      description: 'Check passed.',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Bad token',
      responseType: 'forbidden',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const users = await User.find()
        .sort([{ crewCount: 'DESC' }, { createdAt: 'ASC' }])
        .limit(100);

      const leaderboard = [];
      users.forEach(user => {
        leaderboard.push({
          avatar: user.avatar,
          name: fullFirstLastInitials(user.name),
          uuid: user.uuid,
          shortState: user.shortState,
          districtNumber: user.districtNumber,
          feedback: user.feedback,
          crewCount: user.crewCount,
        });
      });

      return exits.success({
        leaderboard,
      });
    } catch (e) {
      console.log('error at user/leaderboard');
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at user/leaderboardw', e);
      return exits.forbidden();
    }
  },
};

function fullFirstLastInitials(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0]} ${names[names.length - 1].charAt(0)}.`;
  }
  if (names.length === 1) {
    return names[0];
  }
  return '';
}
