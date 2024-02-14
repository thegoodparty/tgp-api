module.exports = {
  friendlyName: 'Full First Last Initials',

  inputs: {
    user: {
      type: 'json',
      required: true,
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = inputs;
      if (user.displayName) {
        return exits.success(user.displayName);
      }
      const name = await sails.helpers.user.name(user);
      const initials = await sails.helpers.fullFirstLastInitials(name);
      return exits.success(initials);
    } catch (e) {
      return exits.success('');
    }
  },
};
