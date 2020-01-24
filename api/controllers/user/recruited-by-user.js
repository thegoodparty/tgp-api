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
      console.log('recruited by user1');
      const user = await User.findOne({ id: this.req.user.id }).populate(
        'recruits',
      );
      console.log('recruited by user2');
      console.log('recruited by user2', user);
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
