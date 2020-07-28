/**
 * user/recruited-by-user.js
 *
 * @description :: Returning user from jwt.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Recruited by user',

  description: 'User with recruited users',

  inputs: {
    preview: {
      type: 'boolean',
      description: 'preview will return max of 3 people',
      required: false,
    },
  },

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
      const { preview } = inputs;
      const user = await User.findOne({ id: this.req.user.id }).populate(
        'crew',
      );
      const sortedCrew = user.crew.sort((a, b) => {
        return b.crewCount - a.crewCount;
      });
      const crew = [];
      const previewLimit = 3;
      const limit = preview
        ? Math.min(previewLimit, user.crew.length)
        : user.crew.length;

      for (let i = 0; i < limit; i++) {
        const userCrew = sortedCrew[i];
        crew.push({
          avatar: userCrew.avatar,
          name: fullFirstLastInitials(userCrew.name),
          uuid: userCrew.uuid,
          shortState: userCrew.shortState,
          districtNumber: userCrew.districtNumber,
          feedback: userCrew.feedback,
        });
      }
      // updating the crewCount for the user - to make sure they are in sync.
      const crewCount = user.crew ? user.crew.length + 1 : 1;
      await User.updateOne({ id: user.id }).set({
        crewCount,
      });

      return exits.success({
        crew,
        crewCount,
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
