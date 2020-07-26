/**
 * user/recruited-by-user.js
 *
 * @description :: Returning user from jwt.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Recruited by user',

  description: 'User with recruited users',

  exits: {
    success: {
      description: 'Crew found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'error getting crew',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const user = await User.findOne({ id: this.req.user.id }).populate(
        'crew',
      );
      // very expensive queries here. TODO: optimize, cache or denormalize.
      const crew = [];
      for (let i = 0; i < user.crew.length; i++) {
        const userCrew = user.crew[i];
        const crewCrew = await User.findOne({ id: userCrew.id }).populate(
          'crew',
        );
        crew.push({
          avatar: userCrew.avatar,
          name: fullFirstLastInitials(userCrew.name),
          uuid: userCrew.uuid,
          crewCount: crewCrew.crew.length,
        });
      }
      crew.sort((a, b) => {
        return a.crewCount - b.crewCount;
      });
      return exits.success({
        crew,
      });
    } catch (e) {
      console.log('error at user/crew');
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at user/crew', e);
      return exits.badRequest();
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
