module.exports = {
  friendlyName: 'Full First Last Initials',

  inputs: {
    name: {
      type: 'string',
      required: true,
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { name } = inputs;
      const names = name.trim().split(' ');
      if (names.length > 1) {
        return exits.success(
          `${names[0]} ${names[names.length - 1].charAt(0).toUpperCase()}.`,
        );
      }
      if (names.length === 1) {
        return exits.success(names[0]);
      }
      return exits.success('');
    } catch (e) {
      return exits.success('');
    }
  },
};
