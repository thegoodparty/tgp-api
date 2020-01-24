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
        'recruits',
      );
      return exits.success({
        user,
      });
    } catch (e) {
      console.log('error at user/recruited-by-user');
      console.log(e);
      return exits.forbidden();
    }
  },
};
