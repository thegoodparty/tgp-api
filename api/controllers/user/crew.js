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
      const user = await User.findOne({ id: this.req.user.id }).populate(
        'crew',
      );
      const crew = [];
      user.crew.forEach(userCrew => {
        crew.push({
          avatar: userCrew.avatar,
          name: fullFirstLastInitials(userCrew.name),
          uuid: userCrew.uuid,
          shortState: userCrew.shortState,
          districtNumber: userCrew.districtNumber,
          feedback: userCrew.feedback,
        });
      });
      return exits.success({
        crew,
      });
    } catch (e) {
      console.log('error at user/crew');
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at user/crew', e);
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
